import { createHash } from "node:crypto";
import { getCatalogueCategory } from "@/catalogue/categories";

export const runtime = "nodejs";

type DeleteRequest = {
  urls?: unknown;
  category?: unknown;
  companyId?: unknown;
};

type CloudinaryDestroyResponse = {
  result?: string;
  error?: {
    message?: string;
  };
};

type FirebaseLookupUser = {
  localId?: string;
  customAttributes?: string;
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) return null;

  return authorization.slice("Bearer ".length).trim();
}

async function verifyFirebaseAdmin(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Firebase server settings are missing.");

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    }
  );

  if (!response.ok) return false;

  const data = (await response.json()) as { users?: FirebaseLookupUser[] };
  const user = data.users?.[0];
  if (!user?.localId) return false;

  try {
    const claims = JSON.parse(user.customAttributes ?? "{}") as {
      admin?: unknown;
    };
    return claims.admin === true;
  } catch {
    return false;
  }
}

function getGalleryDocumentPath(categorySlug: string, companyId: unknown) {
  const category = getCatalogueCategory(categorySlug);
  if (!category) return null;

  if (category.mode === "flat") {
    return `catalogues/${category.collection}`;
  }

  if (
    typeof companyId !== "string" ||
    !/^[a-zA-Z0-9_-]+$/.test(companyId)
  ) {
    return null;
  }

  return `${category.collection}/${companyId}`;
}

async function getGalleryTrash({
  documentPath,
  idToken,
}: {
  documentPath: string;
  idToken: string;
}) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project settings are missing.");

  const encodedPath = documentPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodedPath}`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "Gallery not found."
        : "Gallery ownership could not be verified."
    );
  }

  const data = (await response.json()) as {
    fields?: {
      trash?: {
        arrayValue?: {
          values?: Array<{ stringValue?: string }>;
        };
      };
    };
  };

  return new Set(
    (data.fields?.trash?.arrayValue?.values ?? [])
      .map((value) => value.stringValue)
      .filter((value): value is string => Boolean(value))
  );
}

function getCloudinaryPublicId(urlValue: string, cloudName: string) {
  let url: URL;

  try {
    url = new URL(urlValue);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (
    segments[0] !== cloudName ||
    segments[1] !== "image" ||
    segments[2] !== "upload"
  ) {
    return null;
  }

  const versionIndex = segments.findIndex(
    (segment, index) => index >= 3 && /^v\d+$/.test(segment)
  );
  if (versionIndex === -1 || versionIndex === segments.length - 1) {
    return null;
  }

  const publicIdWithExtension = segments.slice(versionIndex + 1).join("/");
  const extensionIndex = publicIdWithExtension.lastIndexOf(".");
  const encodedPublicId =
    extensionIndex > 0
      ? publicIdWithExtension.slice(0, extensionIndex)
      : publicIdWithExtension;

  try {
    return decodeURIComponent(encodedPublicId);
  } catch {
    return null;
  }
}

async function destroyCloudinaryImage({
  publicId,
  cloudName,
  apiKey,
  apiSecret,
}: {
  publicId: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureSource =
    `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1")
    .update(signatureSource)
    .digest("hex");
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
    invalidate: "true",
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );
  const data = (await response.json()) as CloudinaryDestroyResponse;

  if (
    response.ok &&
    (data.result === "ok" || data.result === "not found")
  ) {
    return;
  }

  throw new Error(
    data.error?.message || `Cloudinary deletion failed (${response.status}).`
  );
}

export async function POST(request: Request) {
  const idToken = getBearerToken(request);
  if (!idToken) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    if (!(await verifyFirebaseAdmin(idToken))) {
      return Response.json(
        { error: "Administrator access is required." },
        { status: 403 }
      );
    }
  } catch {
    return Response.json(
      { error: "The admin login could not be verified. Please try again." },
      { status: 503 }
    );
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json(
      { error: "Cloudinary deletion settings are missing." },
      { status: 500 }
    );
  }

  let body: DeleteRequest;

  try {
    body = (await request.json()) as DeleteRequest;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    !Array.isArray(body.urls) ||
    body.urls.length === 0 ||
    body.urls.length > 200 ||
    body.urls.some((url) => typeof url !== "string")
  ) {
    return Response.json(
      { error: "Provide between 1 and 200 image URLs." },
      { status: 400 }
    );
  }

  if (typeof body.category !== "string") {
    return Response.json(
      { error: "A valid gallery is required." },
      { status: 400 }
    );
  }

  const documentPath = getGalleryDocumentPath(
    body.category,
    body.companyId
  );
  if (!documentPath) {
    return Response.json(
      { error: "A valid gallery is required." },
      { status: 400 }
    );
  }

  const urls = [...new Set(body.urls as string[])];
  let galleryTrash: Set<string>;

  try {
    galleryTrash = await getGalleryTrash({ documentPath, idToken });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gallery ownership could not be verified.",
      },
      { status: 403 }
    );
  }

  if (urls.some((url) => !galleryTrash.has(url))) {
    return Response.json(
      {
        error:
          "Deletion was rejected because one or more photos are not in this gallery's recycle bin.",
      },
      { status: 403 }
    );
  }

  const deletedUrls: string[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  await Promise.all(
    urls.map(async (url) => {
      const publicId = getCloudinaryPublicId(url, cloudName);

      if (!publicId) {
        failed.push({
          url,
          error: "This is not a supported Cloudinary upload URL.",
        });
        return;
      }

      try {
        await destroyCloudinaryImage({
          publicId,
          cloudName,
          apiKey,
          apiSecret,
        });
        deletedUrls.push(url);
      } catch (error) {
        failed.push({
          url,
          error:
            error instanceof Error ? error.message : "Deletion failed.",
        });
      }
    })
  );

  return Response.json({ deletedUrls, failed });
}

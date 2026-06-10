"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { auth, db } from "@/firebase/config";
import type {
  CatalogueCategory,
  CompanyDocument,
  GalleryDocument,
} from "@/catalogue/categories";

type UploadStatus = "uploading" | "saving" | "complete" | "error";

type UploadProgress = {
  status: UploadStatus;
  loadedBytes: number;
  totalBytes: number;
  completedFiles: number;
  totalFiles: number;
  bytesPerSecond: number;
  error?: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function uploadCloudinaryFile({
  file,
  endpoint,
  uploadPreset,
  onProgress,
}: {
  file: File;
  endpoint: string;
  uploadPreset: string;
  onProgress: (loadedBytes: number) => void;
}) {
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const form = new FormData();

    form.append("file", file);
    form.append("upload_preset", uploadPreset);

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    });

    request.addEventListener("load", () => {
      try {
        const data = JSON.parse(request.responseText) as {
          secure_url?: string;
          error?: { message?: string };
        };

        if (
          request.status >= 200 &&
          request.status < 300 &&
          data.secure_url
        ) {
          onProgress(file.size);
          resolve(data.secure_url);
          return;
        }

        reject(new Error(data.error?.message || "Cloudinary upload failed."));
      } catch {
        reject(new Error("Cloudinary returned an invalid response."));
      }
    });

    request.addEventListener("error", () => {
      reject(new Error("Network error while uploading to Cloudinary."));
    });

    request.open("POST", endpoint);
    request.send(form);
  });
}

type SortableImageProps = {
  image: string;
  index: number;
  selected: boolean;
  onSelect: (image: string) => void;
  onView: (image: string) => void;
};

function SortableImage({
  image,
  index,
  selected,
  onSelect,
  onView,
}: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={`relative overflow-hidden rounded-lg border bg-[#0b1020] ${
        selected ? "border-red-400" : "border-[#d0ab4f]/25"
      } admin-sortable-image`}
    >
      <button type="button" onClick={() => onView(image)} className="w-full">
        <img
          src={image}
          alt={`Design ${index + 1}`}
          className="h-24 w-full object-cover"
        />
      </button>

      <button
        type="button"
        onClick={() => onSelect(image)}
        className="w-full bg-[#1d2a4b] py-1 text-xs font-semibold text-white"
      >
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

type SortableCompanyProps = {
  company: CompanyDocument;
  categorySlug: string;
  onDelete: (company: CompanyDocument) => void;
};

function SortableCompany({
  company,
  categorySlug,
  onDelete,
}: SortableCompanyProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: company.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="admin-company-row"
    >
      <a
        href={`/admin/categories/${categorySlug}/${company.id}`}
        className="admin-company-link"
      >
        <span>{company.name}</span>
        <small>{company.images.length} designs</small>
      </a>

      <button
        type="button"
        onClick={() => onDelete(company)}
        className="admin-company-delete"
      >
        Delete
      </button>
    </div>
  );
}

type AdminGalleryManagerProps = {
  category: CatalogueCategory;
  companyId?: string;
};

export function AdminGalleryManager({
  category,
  companyId,
}: AdminGalleryManagerProps) {
  const router = useRouter();
  const documentRef = useMemo(
    () =>
      category.mode === "grouped" && companyId
        ? doc(db, category.collection, companyId)
        : doc(db, "catalogues", category.collection),
    [category.collection, category.mode, companyId]
  );

  const [gallery, setGallery] = useState<GalleryDocument | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgress | null>(null);
  const [uploadExpanded, setUploadExpanded] = useState(false);
  const [emptyingBin, setEmptyingBin] = useState(false);
  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadGallery = useCallback(async () => {
    try {
      const snapshot = await getDoc(documentRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<GalleryDocument>;
        setGallery({
          name: data.name ?? category.title,
          images: data.images ?? [],
          trash: data.trash ?? [],
          order: data.order,
        });
        setNewName(data.name ?? category.title);
        return;
      }

      if (category.mode === "flat" && category.legacyGroupedCollection) {
        const legacySnapshot = await getDocs(
          collection(db, category.legacyGroupedCollection)
        );
        const legacyGalleries = legacySnapshot.docs
          .map((item) => {
            const data = item.data() as Partial<GalleryDocument>;
            return {
              name: data.name ?? item.id,
              images: data.images ?? [],
              trash: data.trash ?? [],
              order: data.order,
            };
          })
          .sort(
            (first, second) =>
              (first.order ?? Number.MAX_SAFE_INTEGER) -
                (second.order ?? Number.MAX_SAFE_INTEGER) ||
              first.name.localeCompare(second.name)
          );
        const migratedGallery: GalleryDocument = {
          name: category.title,
          images: legacyGalleries.flatMap((item) => item.images),
          trash: legacyGalleries.flatMap((item) => item.trash),
        };

        await setDoc(documentRef, migratedGallery, { merge: true });
        setGallery(migratedGallery);
        setNewName(category.title);
        return;
      }

      setGallery({
        name: category.title,
        images: [],
        trash: [],
      });
      setNewName(category.title);
    } finally {
      setLoading(false);
    }
  }, [
    category.legacyGroupedCollection,
    category.mode,
    category.title,
    documentRef,
  ]);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  const images = gallery?.images ?? [];
  const trash = gallery?.trash ?? [];

  const saveGallery = async (nextGallery: GalleryDocument) => {
    const firestoreGallery: GalleryDocument = {
      name: nextGallery.name,
      images: nextGallery.images,
      trash: nextGallery.trash ?? [],
      ...(nextGallery.order !== undefined
        ? { order: nextGallery.order }
        : {}),
    };

    await setDoc(documentRef, firestoreGallery, { merge: true });
    setGallery(nextGallery);
  };

  const uploadImages = async () => {
    if (!files.length || !gallery) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary settings are missing.");
      return;
    }

    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    const loadedByFile = files.map(() => 0);
    const startedAt = performance.now();
    let completedFiles = 0;

    const updateProgress = (
      status: UploadStatus,
      error?: string
    ) => {
      const loadedBytes = loadedByFile.reduce(
        (total, loaded) => total + loaded,
        0
      );
      const elapsedSeconds = Math.max(
        (performance.now() - startedAt) / 1000,
        0.1
      );

      setUploadProgress({
        status,
        loadedBytes,
        totalBytes,
        completedFiles,
        totalFiles: files.length,
        bytesPerSecond: loadedBytes / elapsedSeconds,
        error,
      });
    };

    setUploadProgress({
      status: "uploading",
      loadedBytes: 0,
      totalBytes,
      completedFiles: 0,
      totalFiles: files.length,
      bytesPerSecond: 0,
    });
    setUploadExpanded(true);

    try {
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadedUrls = await Promise.all(
        files.map(async (file, index) => {
          const uploadedUrl = await uploadCloudinaryFile({
            file,
            endpoint,
            uploadPreset,
            onProgress: (loadedBytes) => {
              loadedByFile[index] = Math.min(loadedBytes, file.size);
              updateProgress("uploading");
            },
          });

          loadedByFile[index] = file.size;
          completedFiles += 1;
          updateProgress("uploading");
          return uploadedUrl;
        })
      );

      updateProgress("saving");
      await saveGallery({
        ...gallery,
        images: [...images, ...uploadedUrls],
      });
      setFiles([]);
      updateProgress("complete");
    } catch (error) {
      updateProgress(
        "error",
        error instanceof Error ? error.message : "Upload failed."
      );
    }
  };

  useEffect(() => {
    if (uploadProgress?.status !== "complete") return;

    const closeTimer = window.setTimeout(() => {
      setUploadExpanded(false);
    }, 1600);
    const removeTimer = window.setTimeout(() => {
      setUploadProgress(null);
    }, 2200);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [uploadProgress?.status]);

  const toggleSelect = (image: string) => {
    setSelectedImages((current) =>
      current.includes(image)
        ? current.filter((item) => item !== image)
        : [...current, image]
    );
  };

  const bulkDelete = async () => {
    if (!gallery || selectedImages.length === 0) return;

    const imageCount = selectedImages.length;
    const confirmed = confirm(
      `Move ${imageCount} selected photo${imageCount === 1 ? "" : "s"} to the recycle bin?\n\nThe original ${imageCount === 1 ? "photo" : "photos"} will remain in Cloudinary and can be restored later.`
    );
    if (!confirmed) return;

    const remaining = images.filter((image) => !selectedImages.includes(image));
    const moved = images.filter((image) => selectedImages.includes(image));

    try {
      await saveGallery({
        ...gallery,
        images: remaining,
        trash: [...trash, ...moved],
      });
      setSelectedImages([]);
    } catch {
      alert(
        `The selected photo${imageCount === 1 ? "" : "s"} could not be moved to the recycle bin.`
      );
    }
  };

  const restoreImage = async (image: string) => {
    if (!gallery) return;

    await saveGallery({
      ...gallery,
      images: [...images, image],
      trash: trash.filter((item) => item !== image),
    });
  };

  const emptyRecycleBin = async () => {
    if (!gallery || trash.length === 0 || emptyingBin) return;

    const first = confirm(
      "This will permanently remove every image from the recycle bin and Cloudinary."
    );
    if (!first) return;

    const second = confirm("Are you sure?");
    if (!second) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Your admin session has expired. Please log in again.");
      return;
    }

    setEmptyingBin(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: trash }),
      });
      const result = (await response.json()) as {
        error?: string;
        deletedUrls?: string[];
        failed?: Array<{ url: string; error: string }>;
      };

      if (!response.ok) {
        throw new Error(result.error || "Cloudinary deletion failed.");
      }

      const deletedUrls = new Set(result.deletedUrls ?? []);
      if (deletedUrls.size > 0) {
        await saveGallery({
          ...gallery,
          trash: trash.filter((image) => !deletedUrls.has(image)),
        });
      }

      if (result.failed?.length) {
        alert(
          `${result.failed.length} photo${result.failed.length === 1 ? "" : "s"} could not be deleted and will remain in the recycle bin.\n\n${result.failed[0].error}`
        );
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "The recycle bin could not be emptied."
      );
    } finally {
      setEmptyingBin(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!gallery) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.indexOf(String(active.id));
    const newIndex = images.indexOf(String(over.id));
    const nextImages = arrayMove(images, oldIndex, newIndex);

    await saveGallery({
      ...gallery,
      images: nextImages,
    });
  };

  const renameGallery = async () => {
    if (!gallery) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("Enter a name.");
      return;
    }

    if (category.mode === "flat") {
      await saveGallery({ ...gallery, name: trimmedName });
      return;
    }

    if (!companyId) return;

    const newId = trimmedName.toLowerCase().replace(/\s+/g, "-");
    if (newId === companyId) {
      await saveGallery({ ...gallery, name: trimmedName });
      return;
    }

    const ok = confirm(`Rename "${gallery.name}" to "${trimmedName}"?`);
    if (!ok) return;

    const renamedGallery: GalleryDocument = {
      name: trimmedName,
      images: gallery.images,
      trash: gallery.trash ?? [],
      ...(gallery.order !== undefined ? { order: gallery.order } : {}),
    };

    await setDoc(doc(db, category.collection, newId), renamedGallery);
    await deleteDoc(doc(db, category.collection, companyId));
    router.replace(`/admin/categories/${category.slug}/${newId}`);
  };

  const uploadIsActive =
    uploadProgress?.status === "uploading" ||
    uploadProgress?.status === "saving";
  const uploadPercent = uploadProgress
    ? Math.round(
        (uploadProgress.loadedBytes / Math.max(uploadProgress.totalBytes, 1)) *
          100
      )
    : 0;

  if (loading || !gallery) {
    return <div className="text-white/65">Loading...</div>;
  }

  return (
    <div className="text-white">
      <h1 className="mb-4 text-3xl font-bold capitalize">{gallery.name}</h1>

      <section className="mb-6 rounded-lg border border-[#d0ab4f]/25 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-semibold text-[#d0ab4f]">
          Gallery Settings
        </h2>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Gallery name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className="flex-1 rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] px-3 py-2 text-white outline-none focus:border-[#d0ab4f]"
          />

          <button
            type="button"
            onClick={renameGallery}
            className="rounded-lg bg-[#d0ab4f] px-4 py-2 font-semibold text-[#10182f] hover:bg-[#ead59a]"
          >
            Save Name
          </button>
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="file"
          multiple
          disabled={uploadIsActive}
          onChange={(event) =>
            setFiles(Array.from(event.target.files ?? []))
          }
          className="rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] p-2 text-sm text-white"
        />

        <button
          type="button"
          onClick={uploadImages}
          disabled={uploadIsActive || files.length === 0}
          className="rounded-lg bg-[#d0ab4f] px-3 py-2 font-semibold text-[#10182f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadIsActive ? "Uploading..." : `Upload${files.length ? ` (${files.length})` : ""}`}
        </button>

        <button
          type="button"
          onClick={bulkDelete}
          disabled={selectedImages.length === 0}
          className="rounded-lg bg-red-600 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete Selected
        </button>
      </section>

      {uploadProgress && (
        <section className="admin-upload-dropdown" aria-live="polite">
          <button
            type="button"
            className={`admin-upload-summary admin-upload-${uploadProgress.status}`}
            onClick={() => setUploadExpanded((current) => !current)}
            aria-expanded={uploadExpanded}
          >
            <span>
              {uploadProgress.status === "uploading" && "Uploading photos"}
              {uploadProgress.status === "saving" && "Saving gallery"}
              {uploadProgress.status === "complete" && "Upload complete"}
              {uploadProgress.status === "error" && "Upload failed"}
            </span>
            <strong>{Math.min(uploadPercent, 100)}%</strong>
            <span className="admin-upload-chevron" aria-hidden>
              {uploadExpanded ? "^" : "v"}
            </span>
          </button>

          {uploadExpanded && (
            <div className={`admin-upload-panel admin-upload-${uploadProgress.status}`}>
              <p>
                {uploadProgress.status === "uploading" &&
                  `${uploadProgress.completedFiles} of ${uploadProgress.totalFiles} files completed`}
                {uploadProgress.status === "saving" &&
                  "Updating the gallery in Firebase..."}
                {uploadProgress.status === "complete" &&
                  `${uploadProgress.totalFiles} files uploaded successfully`}
                {uploadProgress.status === "error" && uploadProgress.error}
              </p>

              <div
                className="admin-upload-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(uploadPercent, 100)}
              >
                <span
                  className="admin-upload-fill"
                  style={{ width: `${Math.min(uploadPercent, 100)}%` }}
                />
              </div>

              <div className="admin-upload-details">
                <span>
                  {formatBytes(uploadProgress.loadedBytes)} of{" "}
                  {formatBytes(uploadProgress.totalBytes)}
                </span>
                <span>{formatBytes(uploadProgress.bytesPerSecond)}/s</span>
              </div>
            </div>
          )}
        </section>
      )}

      <DndContext
        sensors={dragSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {images.map((image, index) => (
              <SortableImage
                key={`${image}-${index}`}
                image={image}
                index={index}
                selected={selectedImages.includes(image)}
                onSelect={toggleSelect}
                onView={setSelectedImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {trash.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[#d0ab4f]">Recycle Bin</h2>

            <button
              type="button"
              onClick={emptyRecycleBin}
              disabled={emptyingBin}
              className="rounded-lg bg-red-700 px-3 py-1 text-xs text-white disabled:cursor-wait disabled:opacity-60"
            >
              {emptyingBin ? "Deleting..." : "Empty Bin"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {trash.map((image, index) => (
              <div key={`${image}-${index}`} className="relative overflow-hidden rounded-lg border border-[#d0ab4f]/20">
                <img
                  src={image}
                  alt={`Deleted design ${index + 1}`}
                  className="h-20 w-full object-cover opacity-60"
                />

                <button
                  type="button"
                  onClick={() => restoreImage(image)}
                  className="absolute bottom-1 left-1 rounded bg-green-600 px-2 py-1 text-xs text-white"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedImage && (
        <div className="lightbox">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="lightbox-control lightbox-close"
            aria-label="Close image viewer"
          >
            x
          </button>

          <img
            src={selectedImage}
            alt="Selected design"
            className="lightbox-image"
          />
        </div>
      )}
    </div>
  );
}

type AdminCompanyListProps = {
  category: CatalogueCategory;
};

export function AdminCompanyList({ category }: AdminCompanyListProps) {
  const [companies, setCompanies] = useState<CompanyDocument[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const companyDragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadCompanies = useCallback(() => {
    getDocs(collection(db, category.collection))
      .then((snapshot) => {
        setCompanies(
          snapshot.docs
            .map((item) => {
              const data = item.data() as Partial<CompanyDocument>;
              return {
                id: item.id,
                name: data.name ?? item.id,
                images: data.images ?? [],
                trash: data.trash ?? [],
                order: data.order,
              };
            })
            .sort(
              (first, second) =>
                (first.order ?? Number.MAX_SAFE_INTEGER) -
                  (second.order ?? Number.MAX_SAFE_INTEGER) ||
                first.name.localeCompare(second.name)
            )
            .map((company, order) => ({ ...company, order }))
        );
      })
      .finally(() => setLoading(false));
  }, [category.collection]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const addCompany = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = trimmedName.toLowerCase().replace(/\s+/g, "-");

    const batch = writeBatch(db);
    companies.forEach((company, order) => {
      batch.set(
        doc(db, category.collection, company.id),
        { order },
        { merge: true }
      );
    });
    batch.set(doc(db, category.collection, id), {
      name: trimmedName,
      images: [],
      trash: [],
      order: companies.length,
    });
    await batch.commit();

    setName("");
    loadCompanies();
  };

  const handleCompanyDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = companies.findIndex(
      (company) => company.id === String(active.id)
    );
    const newIndex = companies.findIndex(
      (company) => company.id === String(over.id)
    );
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedCompanies = arrayMove(companies, oldIndex, newIndex).map(
      (company, order) => ({ ...company, order })
    );

    setCompanies(reorderedCompanies);

    try {
      const batch = writeBatch(db);
      reorderedCompanies.forEach((company) => {
        batch.set(
          doc(db, category.collection, company.id),
          { order: company.order },
          { merge: true }
        );
      });
      await batch.commit();
    } catch {
      alert("Company order could not be saved.");
      loadCompanies();
    }
  };

  const deleteCompany = async (company: CompanyDocument) => {
    const input = prompt(`Type "${company.name}" to confirm`);
    if (input !== company.name) return;

    await deleteDoc(doc(db, category.collection, company.id));
    loadCompanies();
  };

  return (
    <div className="text-white">
      <div className="mb-6 border-b border-[#d0ab4f]/25 pb-4">
        <h1 className="text-3xl font-bold">{category.title}</h1>
        <p className="mt-1 text-white/65">Manage company-wise galleries.</p>
      </div>

      <div className="mb-6 flex flex-col gap-2 md:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] p-2 text-white outline-none focus:border-[#d0ab4f]"
          placeholder="Add company"
        />

        <button
          type="button"
          onClick={addCompany}
          className="rounded-lg bg-[#d0ab4f] px-3 py-2 font-semibold text-[#10182f]"
        >
          Add
        </button>
      </div>

      {loading ? (
        <div className="text-white/65">Loading...</div>
      ) : (
        <DndContext
          sensors={companyDragSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCompanyDragEnd}
        >
          <SortableContext
            items={companies.map((company) => company.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="admin-company-list">
              {companies.map((company) => (
                <SortableCompany
                  key={company.id}
                  company={company}
                  categorySlug={category.slug}
                  onDelete={deleteCompany}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

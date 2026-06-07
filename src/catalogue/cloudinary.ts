const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

function encodeCloudinaryText(value: string) {
  return encodeURIComponent(value).replace(/%2F/gi, "%252F");
}

function getWatermarkTransformation() {
  const watermarkText =
    process.env.NEXT_PUBLIC_CLOUDINARY_WATERMARK_TEXT?.trim() ||
    "Varsha Cushions";
  const configuredWidth = Number(
    process.env.NEXT_PUBLIC_CLOUDINARY_WATERMARK_WIDTH ?? "0.48"
  );
  const watermarkWidth =
    Number.isFinite(configuredWidth) &&
    configuredWidth >= 0.2 &&
    configuredWidth <= 0.8
      ? configuredWidth
      : 0.48;
  const encodedText = encodeCloudinaryText(watermarkText);

  return [
    `l_text:Arial_54_bold:${encodedText},co_rgb:FFFFFF,o_32`,
    `c_scale,fl_relative,w_${watermarkWidth}`,
    "fl_layer_apply,g_center",
  ];
}

function getTransformedCloudinaryUrl(
  imageUrl: string,
  deliveryTransformations: string[]
) {
  if (!imageUrl.includes("res.cloudinary.com")) return imageUrl;

  const uploadIndex = imageUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) return imageUrl;

  const insertionPoint = uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
  const transformations = [
    ...deliveryTransformations,
    ...getWatermarkTransformation(),
  ].join("/");

  return `${imageUrl.slice(0, insertionPoint)}${transformations}/${imageUrl.slice(insertionPoint)}`;
}

export function getPublicCatalogueThumbnailUrl(imageUrl: string) {
  return getTransformedCloudinaryUrl(imageUrl, [
    "c_fill,g_auto,h_480,w_480",
    "f_auto,q_auto:eco",
  ]);
}

export function getPublicCatalogueImageUrl(imageUrl: string) {
  return getTransformedCloudinaryUrl(imageUrl, [
    "c_limit,h_1600,w_1600",
    "f_auto,q_auto:good",
  ]);
}

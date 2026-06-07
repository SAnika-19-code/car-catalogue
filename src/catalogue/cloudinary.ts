const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

function encodeCloudinaryText(value: string) {
  return encodeURIComponent(value).replace(/%2F/gi, "%252F");
}

export function getPublicCatalogueImageUrl(imageUrl: string) {
  if (!imageUrl.includes("res.cloudinary.com")) return imageUrl;

  const uploadIndex = imageUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) return imageUrl;

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
  const watermarkTransformation = [
    `l_text:Arial_54_bold:${encodedText},co_rgb:FFFFFF,o_32`,
    `c_scale,fl_relative,w_${watermarkWidth}`,
    "fl_layer_apply,g_center",
  ].join("/");

  const insertionPoint = uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length;

  return `${imageUrl.slice(0, insertionPoint)}${watermarkTransformation}/${imageUrl.slice(insertionPoint)}`;
}

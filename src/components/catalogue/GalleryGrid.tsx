"use client";

import { getPublicCatalogueImageUrl } from "@/catalogue/cloudinary";

type GalleryGridProps = {
  images: string[];
  title: string;
  onImageClick: (index: number) => void;
};

export function GalleryGrid({ images, title, onImageClick }: GalleryGridProps) {
  if (images.length === 0) {
    return (
      <div className="empty-state">
        No designs uploaded yet.
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {images.map((image, index) => (
        <button
          type="button"
          key={`${image}-${index}`}
          className="gallery-tile"
          onClick={() => onImageClick(index)}
          onContextMenu={(event) => event.preventDefault()}
        >
          <img
            src={getPublicCatalogueImageUrl(image)}
            alt={`${title} design ${index + 1}`}
            className="gallery-image"
            draggable={false}
            onContextMenu={(event) => event.preventDefault()}
          />
        </button>
      ))}
    </div>
  );
}

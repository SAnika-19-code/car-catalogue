"use client";

import { useEffect } from "react";

type ImageLightboxProps = {
  images: string[];
  selectedIndex: number | null;
  title: string;
  onSelect: (index: number | null) => void;
};

export function ImageLightbox({
  images,
  selectedIndex,
  title,
  onSelect,
}: ImageLightboxProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (selectedIndex === null || images.length === 0) return;

      if (event.key === "Escape") {
        onSelect(null);
      }

      if (event.key === "ArrowRight") {
        onSelect((selectedIndex + 1) % images.length);
      }

      if (event.key === "ArrowLeft") {
        onSelect((selectedIndex - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onSelect, selectedIndex]);

  if (selectedIndex === null || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="absolute right-5 top-5 text-3xl text-white"
        aria-label="Close image viewer"
      >
        x
      </button>

      <button
        type="button"
        onClick={() =>
          onSelect((selectedIndex - 1 + images.length) % images.length)
        }
        className="absolute left-5 text-4xl text-white"
        aria-label="Previous image"
      >
        {"<"}
      </button>

      <img
        src={images[selectedIndex]}
        alt={`${title} design ${selectedIndex + 1}`}
        className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
      />

      <button
        type="button"
        onClick={() => onSelect((selectedIndex + 1) % images.length)}
        className="absolute right-5 text-4xl text-white"
        aria-label="Next image"
      >
        {">"}
      </button>
    </div>
  );
}

"use client";

import { type TouchEvent, useEffect, useRef } from "react";

type ImageLightboxProps = {
  images: string[];
  selectedIndex: number | null;
  title: string;
  inquiryLabel: string;
  inquiryContext?: string;
  onSelect: (index: number | null) => void;
};

export function ImageLightbox({
  images,
  selectedIndex,
  title,
  inquiryLabel,
  inquiryContext,
  onSelect,
}: ImageLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  const selectedImage = images[selectedIndex];
  const context = inquiryContext ? ` (${inquiryContext})` : "";
  const message = `Hi, I am interested in this ${inquiryLabel} design${context}: ${selectedImage}`;
  const whatsappNumber = (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
  ).replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  const handleTouchStart = (event: TouchEvent<HTMLImageElement>) => {
    if (!window.matchMedia("(max-width: 720px)").matches) return;

    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLImageElement>) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      !window.matchMedia("(max-width: 720px)").matches
    ) {
      return;
    }

    const distanceX = event.changedTouches[0].clientX - touchStartX.current;
    const distanceY = event.changedTouches[0].clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(distanceX) < 50 || Math.abs(distanceX) <= Math.abs(distanceY)) {
      return;
    }

    if (distanceX < 0) {
      onSelect((selectedIndex + 1) % images.length);
    } else {
      onSelect((selectedIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="lightbox">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="lightbox-control lightbox-close"
        aria-label="Close image viewer"
      >
        x
      </button>

      <button
        type="button"
        onClick={() =>
          onSelect((selectedIndex - 1 + images.length) % images.length)
        }
        className="lightbox-control lightbox-prev"
        aria-label="Previous image"
      >
        {"<"}
      </button>

      <div className="lightbox-content">
        <img
          src={selectedImage}
          alt={`${title} design ${selectedIndex + 1}`}
          className="lightbox-image"
          draggable={false}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="whatsapp-inquiry"
        >
          Ask on WhatsApp about this design
        </a>
      </div>

      <button
        type="button"
        onClick={() => onSelect((selectedIndex + 1) % images.length)}
        className="lightbox-control lightbox-next"
        aria-label="Next image"
      >
        {">"}
      </button>
    </div>
  );
}

"use client";

import {
  type CSSProperties,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";

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
  const touchWidth = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [trackPosition, setTrackPosition] = useState(-33.333333);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [pendingDirection, setPendingDirection] = useState<
    "next" | "previous" | null
  >(null);

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
    if (
      !window.matchMedia("(max-width: 720px)").matches ||
      isSettling ||
      images.length < 2
    ) {
      return;
    }

    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
    touchWidth.current = event.currentTarget.parentElement?.clientWidth ?? 0;
    setIsDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLImageElement>) => {
    if (
      !isDragging ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      return;
    }

    const distanceX = event.touches[0].clientX - touchStartX.current;
    const distanceY = event.touches[0].clientY - touchStartY.current;

    if (Math.abs(distanceY) > Math.abs(distanceX)) return;

    setDragOffset(distanceX);
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
    const threshold = Math.min(
      90,
      Math.max(45, touchWidth.current * 0.18)
    );

    touchStartX.current = null;
    touchStartY.current = null;
    setIsDragging(false);

    if (
      Math.abs(distanceX) < threshold ||
      Math.abs(distanceX) <= Math.abs(distanceY)
    ) {
      setIsSettling(true);
      setDragOffset(0);
      return;
    }

    if (distanceX < 0) {
      setPendingDirection("next");
      setIsSettling(true);
      setDragOffset(0);
      setTrackPosition(-66.666667);
    } else {
      setPendingDirection("previous");
      setIsSettling(true);
      setDragOffset(0);
      setTrackPosition(0);
    }
  };

  const handleTrackTransitionEnd = () => {
    if (!isSettling) return;

    if (pendingDirection === "next") {
      onSelect((selectedIndex + 1) % images.length);
    }

    if (pendingDirection === "previous") {
      onSelect((selectedIndex - 1 + images.length) % images.length);
    }

    setIsSettling(false);
    setPendingDirection(null);
    setTrackPosition(-33.333333);
    setDragOffset(0);
  };

  const previousIndex =
    (selectedIndex - 1 + images.length) % images.length;
  const nextIndex = (selectedIndex + 1) % images.length;
  const trackStyle = {
    "--lightbox-track-position": `${trackPosition}%`,
    "--lightbox-drag-offset": `${dragOffset}px`,
  } as CSSProperties;

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
        <div
          className={`lightbox-track ${
            isDragging ? "lightbox-track-dragging" : ""
          } ${isSettling ? "lightbox-track-settling" : ""}`}
          style={trackStyle}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {[previousIndex, selectedIndex, nextIndex].map((imageIndex, slot) => (
            <div className="lightbox-slide" key={`${imageIndex}-${slot}`}>
              <img
                src={images[imageIndex]}
                alt={`${title} design ${imageIndex + 1}`}
                className="lightbox-image"
                draggable={false}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="lightbox-inquiry-bar">
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

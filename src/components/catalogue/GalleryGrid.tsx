"use client";

type GalleryGridProps = {
  images: string[];
  title: string;
  onImageClick: (index: number) => void;
};

export function GalleryGrid({ images, title, onImageClick }: GalleryGridProps) {
  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center text-gray-400">
        No designs uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image, index) => (
        <button
          type="button"
          key={`${image}-${index}`}
          className="group cursor-pointer overflow-hidden rounded-xl bg-zinc-900"
          onClick={() => onImageClick(index)}
        >
          <img
            src={image}
            alt={`${title} design ${index + 1}`}
            className="h-56 w-full object-cover transition duration-300 group-hover:scale-110"
          />
        </button>
      ))}
    </div>
  );
}

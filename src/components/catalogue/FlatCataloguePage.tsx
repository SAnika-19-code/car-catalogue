"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { CatalogueCategory, GalleryDocument } from "@/catalogue/categories";
import { GalleryGrid } from "./GalleryGrid";
import { ImageLightbox } from "./ImageLightbox";

type FlatCataloguePageProps = {
  category: CatalogueCategory;
};

export function FlatCataloguePage({ category }: FlatCataloguePageProps) {
  const [gallery, setGallery] = useState<GalleryDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    getDoc(doc(db, "catalogues", category.collection))
      .then((snapshot) => {
        if (!active) return;

        const data = snapshot.data() as Partial<GalleryDocument> | undefined;
        setGallery({
          name: data?.name ?? category.title,
          images: data?.images ?? [],
          trash: data?.trash ?? [],
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category.collection, category.title]);

  const images = gallery?.images ?? [];

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{category.title}</h1>
        <p className="mt-2 text-gray-400">{category.description}</p>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <GalleryGrid
          images={images}
          title={category.title}
          onImageClick={setSelectedIndex}
        />
      )}

      <ImageLightbox
        images={images}
        selectedIndex={selectedIndex}
        title={category.title}
        onSelect={setSelectedIndex}
      />
    </main>
  );
}

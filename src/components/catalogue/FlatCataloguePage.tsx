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
    <main className="catalogue-shell">
      <div className="catalogue-header">
        <p className="eyebrow">Catalogue collection</p>
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
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

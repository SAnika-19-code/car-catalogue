"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadGallery = async () => {
      try {
        const snapshot = await getDoc(
          doc(db, "catalogues", category.collection)
        );
        if (!active) return;

        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<GalleryDocument>;
          setGallery({
            name: data.name ?? category.title,
            images: data.images ?? [],
            trash: data.trash ?? [],
          });
          return;
        }

        if (category.legacyGroupedCollection) {
          const legacySnapshot = await getDocs(
            collection(db, category.legacyGroupedCollection)
          );
          if (!active) return;

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

          setGallery({
            name: category.title,
            images: legacyGalleries.flatMap((item) => item.images),
            trash: legacyGalleries.flatMap((item) => item.trash),
          });
          return;
        }

        setGallery({
          name: category.title,
          images: [],
          trash: [],
        });
      } catch {
        if (active) {
          setGallery(null);
          setError(
            "This catalogue could not be loaded. Please check your connection and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadGallery();

    return () => {
      active = false;
    };
  }, [
    category.collection,
    category.legacyGroupedCollection,
    category.title,
  ]);

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
      ) : error ? (
        <div className="error-state" role="alert">
          {error}
        </div>
      ) : (
        <GalleryGrid
          images={images}
          title={category.title}
          onImageClick={setSelectedIndex}
        />
      )}

      {!error && (
        <ImageLightbox
          images={images}
          selectedIndex={selectedIndex}
          title={category.title}
          inquiryLabel={category.inquiryLabel}
          onSelect={setSelectedIndex}
        />
      )}
    </main>
  );
}

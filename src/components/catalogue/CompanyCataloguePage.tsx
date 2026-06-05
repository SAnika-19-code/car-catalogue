"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type {
  CatalogueCategory,
  GalleryDocument,
} from "@/catalogue/categories";
import { GalleryGrid } from "./GalleryGrid";
import { ImageLightbox } from "./ImageLightbox";

type CompanyCataloguePageProps = {
  category: CatalogueCategory;
  companyId: string;
};

export function CompanyCataloguePage({
  category,
  companyId,
}: CompanyCataloguePageProps) {
  const [company, setCompany] = useState<GalleryDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    getDoc(doc(db, category.collection, companyId))
      .then((snapshot) => {
        if (!active) return;

        const data = snapshot.data() as Partial<GalleryDocument> | undefined;
        setCompany(
          snapshot.exists()
            ? {
                name: data?.name ?? companyId,
                images: data?.images ?? [],
                trash: data?.trash ?? [],
              }
            : null
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category.collection, companyId]);

  const images = company?.images ?? [];
  const title = company?.name ?? category.title;

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : company ? (
        <>
          <h1 className="mb-8 text-4xl font-bold capitalize">{company.name}</h1>

          <GalleryGrid
            images={images}
            title={title}
            onImageClick={setSelectedIndex}
          />

          <ImageLightbox
            images={images}
            selectedIndex={selectedIndex}
            title={title}
            onSelect={setSelectedIndex}
          />
        </>
      ) : (
        <div className="text-gray-400">Catalogue not found.</div>
      )}
    </main>
  );
}

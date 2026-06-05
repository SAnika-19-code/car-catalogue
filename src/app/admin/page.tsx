"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { catalogueCategories } from "@/catalogue/categories";
import { db } from "@/firebase/config";

type CategoryStat = {
  slug: string;
  title: string;
  galleries: number;
  images: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all(
      catalogueCategories.map(async (category) => {
        if (category.mode === "grouped") {
          const snapshot = await getDocs(collection(db, category.collection));
          const imageCount = snapshot.docs.reduce((total, item) => {
            const data = item.data() as { images?: string[] };
            return total + (data.images?.length ?? 0);
          }, 0);

          return {
            slug: category.slug,
            title: category.title,
            galleries: snapshot.docs.length,
            images: imageCount,
          };
        }

        const snapshot = await getDoc(doc(db, "catalogues", category.collection));
        const data = snapshot.data() as { images?: string[] } | undefined;

        return {
          slug: category.slug,
          title: category.title,
          galleries: 1,
          images: data?.images?.length ?? 0,
        };
      })
    )
      .then((nextStats) => {
        if (active) setStats(nextStats);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const totalImages = stats.reduce((total, item) => total + item.images, 0);
  const totalGalleries = stats.reduce((total, item) => total + item.galleries, 0);

  return (
    <div>
      <div className="mb-6 border-b border-[#d0ab4f]/25 pb-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-white/65">Welcome to admin panel</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#d0ab4f]/25 bg-white/10 p-4 shadow-lg">
          <p className="text-sm font-semibold text-[#d0ab4f]">Categories</p>
          <h2 className="mt-1 text-2xl font-bold">{catalogueCategories.length}</h2>
        </div>

        <div className="rounded-lg border border-[#d0ab4f]/25 bg-white/10 p-4 shadow-lg">
          <p className="text-sm font-semibold text-[#d0ab4f]">Galleries</p>
          <h2 className="mt-1 text-2xl font-bold">{totalGalleries}</h2>
        </div>

        <div className="rounded-lg border border-[#d0ab4f]/25 bg-white/10 p-4 shadow-lg">
          <p className="text-sm font-semibold text-[#d0ab4f]">Total Images</p>
          <h2 className="mt-1 text-2xl font-bold">{totalImages}</h2>
        </div>
      </div>

      {loading ? (
        <div className="text-white/65">Loading...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {stats.map((item) => (
            <div
              key={item.slug}
              className="rounded-lg border border-[#d0ab4f]/20 bg-[#1d2a4b]/75 p-4"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-white/65">
                {item.galleries} galleries / {item.images} images
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

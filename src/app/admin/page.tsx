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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-gray-400">Welcome to admin panel</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-gray-400">Categories</p>
          <h2 className="text-2xl">{catalogueCategories.length}</h2>
        </div>

        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-gray-400">Galleries</p>
          <h2 className="text-2xl">{totalGalleries}</h2>
        </div>

        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-gray-400">Total Images</p>
          <h2 className="text-2xl">{totalImages}</h2>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {stats.map((item) => (
            <div key={item.slug} className="rounded-xl bg-zinc-900 p-4">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-400">
                {item.galleries} galleries / {item.images} images
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

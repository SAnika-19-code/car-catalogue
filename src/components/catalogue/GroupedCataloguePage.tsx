"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import type {
  CatalogueCategory,
  CompanyDocument,
} from "@/catalogue/categories";

type GroupedCataloguePageProps = {
  category: CatalogueCategory;
};

export function GroupedCataloguePage({ category }: GroupedCataloguePageProps) {
  const [companies, setCompanies] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getDocs(collection(db, category.collection))
      .then((snapshot) => {
        if (!active) return;

        setCompanies(
          snapshot.docs.map((item) => {
            const data = item.data() as Partial<CompanyDocument>;
            return {
              id: item.id,
              name: data.name ?? item.id,
              images: data.images ?? [],
              trash: data.trash ?? [],
            };
          })
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category.collection]);

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{category.title}</h1>
        <p className="mt-2 text-gray-400">{category.description}</p>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/${category.slug}/${company.id}`}
              className="card block p-6 transition hover:scale-105"
            >
              <h2 className="text-xl capitalize">{company.name}</h2>
              <p className="mt-2 text-sm text-gray-400">
                {company.images.length} designs
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

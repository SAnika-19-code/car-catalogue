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
    <main className="catalogue-shell">
      <div className="catalogue-header">
        <p className="eyebrow">Company collections</p>
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <div className="company-grid">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/${category.slug}/${company.id}`}
              className="catalogue-card company-card"
            >
              <h2>{company.name}</h2>
              <p>
                {company.images.length} designs
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

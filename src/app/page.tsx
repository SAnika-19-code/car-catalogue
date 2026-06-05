import Link from "next/link";
import { catalogueCategories } from "@/catalogue/categories";

export default function Home() {
  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold">
          Premium Car Accessories Catalogue
        </h1>
        <p className="mt-3 text-gray-400">
          Explore seat covers, lamination, steering covers, and roof designs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {catalogueCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/${category.slug}`}
            className="card block h-full p-6 text-center transition hover:scale-105"
          >
            <h2 className="text-2xl font-semibold">{category.title}</h2>
            <p className="mt-3 text-sm text-gray-400">
              {category.mode === "grouped"
                ? "Company-wise gallery"
                : "Direct gallery"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

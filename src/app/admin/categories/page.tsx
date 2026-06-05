import Link from "next/link";
import { catalogueCategories } from "@/catalogue/categories";

export default function AdminCategoriesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="mt-1 text-gray-400">Choose a gallery to manage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {catalogueCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/admin/categories/${category.slug}`}
            className="block rounded-xl bg-zinc-900 p-4 transition hover:bg-zinc-800"
          >
            <h2 className="text-lg font-semibold">{category.title}</h2>
            <p className="mt-2 text-sm text-gray-400">
              {category.mode === "grouped"
                ? "Company-wise catalogue"
                : "Direct catalogue"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

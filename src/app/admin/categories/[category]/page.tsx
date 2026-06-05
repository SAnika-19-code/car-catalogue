import { notFound } from "next/navigation";
import { getCatalogueCategory } from "@/catalogue/categories";
import {
  AdminCompanyList,
  AdminGalleryManager,
} from "@/components/admin/AdminGalleryManager";

export default async function AdminCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCatalogueCategory(slug);

  if (!category) notFound();

  return category.mode === "grouped" ? (
    <AdminCompanyList category={category} />
  ) : (
    <AdminGalleryManager category={category} />
  );
}

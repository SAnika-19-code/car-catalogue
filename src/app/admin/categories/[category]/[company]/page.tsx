import { notFound } from "next/navigation";
import { getCatalogueCategory } from "@/catalogue/categories";
import { AdminGalleryManager } from "@/components/admin/AdminGalleryManager";

export default async function AdminCompanyGalleryPage({
  params,
}: {
  params: Promise<{ category: string; company: string }>;
}) {
  const { category: slug, company } = await params;
  const category = getCatalogueCategory(slug);

  if (!category || category.mode !== "grouped") notFound();

  return <AdminGalleryManager category={category} companyId={company} />;
}

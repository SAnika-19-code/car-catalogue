import { getCatalogueCategory } from "@/catalogue/categories";
import { CompanyCataloguePage } from "@/components/catalogue/CompanyCataloguePage";

export default async function RoofCompanyPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const category = getCatalogueCategory("roof-design");
  return category ? (
    <CompanyCataloguePage category={category} companyId={company} />
  ) : null;
}

import { getCatalogueCategory } from "@/catalogue/categories";
import { FlatCataloguePage } from "@/components/catalogue/FlatCataloguePage";

export default function FloorLaminationPage() {
  const category = getCatalogueCategory("floor-lamination");
  return category ? <FlatCataloguePage category={category} /> : null;
}

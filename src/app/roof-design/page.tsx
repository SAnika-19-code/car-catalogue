import { getCatalogueCategory } from "@/catalogue/categories";
import { FlatCataloguePage } from "@/components/catalogue/FlatCataloguePage";

export default function RoofDesignPage() {
  const category = getCatalogueCategory("roof-design");
  return category ? <FlatCataloguePage category={category} /> : null;
}

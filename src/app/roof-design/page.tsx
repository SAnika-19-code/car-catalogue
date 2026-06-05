import { getCatalogueCategory } from "@/catalogue/categories";
import { GroupedCataloguePage } from "@/components/catalogue/GroupedCataloguePage";

export default function RoofDesignPage() {
  const category = getCatalogueCategory("roof-design");
  return category ? <GroupedCataloguePage category={category} /> : null;
}

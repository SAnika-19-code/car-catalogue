import { getCatalogueCategory } from "@/catalogue/categories";
import { FlatCataloguePage } from "@/components/catalogue/FlatCataloguePage";

export default function SteeringCoversPage() {
  const category = getCatalogueCategory("steering-covers");
  return category ? <FlatCataloguePage category={category} /> : null;
}

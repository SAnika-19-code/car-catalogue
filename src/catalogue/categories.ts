export type CatalogueMode = "grouped" | "flat";

export type CatalogueCategory = {
  slug: string;
  title: string;
  inquiryLabel: string;
  description: string;
  collection: string;
  mode: CatalogueMode;
};

export const catalogueCategories = [
  {
    slug: "seat-covers",
    title: "Car Seat Covers",
    inquiryLabel: "seat cover",
    description: "Premium seat cover designs grouped by company.",
    collection: "seat-covers",
    mode: "grouped",
  },
  {
    slug: "steering-covers",
    title: "Steering Covers",
    inquiryLabel: "steering cover",
    description: "Browse steering cover designs in one gallery.",
    collection: "steering-covers",
    mode: "flat",
  },
  {
    slug: "floor-lamination",
    title: "Floor Lamination",
    inquiryLabel: "floor lamination",
    description: "Browse floor lamination designs in one gallery.",
    collection: "floor-lamination",
    mode: "flat",
  },
  {
    slug: "roof-design",
    title: "Roof Design",
    inquiryLabel: "roof",
    description: "Roof design catalogue grouped by company.",
    collection: "roof-design",
    mode: "grouped",
  },
] as const satisfies CatalogueCategory[];

export function getCatalogueCategory(slug: string) {
  return catalogueCategories.find((category) => category.slug === slug);
}

export type GalleryDocument = {
  name: string;
  images: string[];
  trash?: string[];
};

export type CompanyDocument = GalleryDocument & {
  id: string;
};

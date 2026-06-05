import Image from "next/image";
import Link from "next/link";
import { catalogueCategories } from "@/catalogue/categories";
import logo from "../logo.png";

export default function Home() {
  return (
    <main className="catalogue-shell home-shell">
      <section className="home-hero">
        <div className="brand-lockup">
          <Image
            src={logo}
            alt="Premium Car Accessories Catalogue logo"
            priority
            className="brand-logo"
          />
          <div className="brand-copy">
            <p className="eyebrow">Luxury automotive interiors</p>
            <h1>Premium Car Accessories Catalogue</h1>
            <p>
              Explore curated seat covers, floor lamination, steering covers,
              and roof designs with a polished showroom feel.
            </p>
          </div>
        </div>
      </section>

      <section className="category-grid" aria-label="Catalogue categories">
        {catalogueCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/${category.slug}`}
            className="catalogue-card category-card"
          >
            <span className="category-index">
              {String(catalogueCategories.indexOf(category) + 1).padStart(
                2,
                "0"
              )}
            </span>
            <h2>{category.title}</h2>
            <p>
              {category.mode === "grouped"
                ? "Company-wise gallery"
                : "Direct gallery"}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}

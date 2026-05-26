import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-10 bg-black text-white">

      {/* HERO */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold">
          Premium Car Accessories Catalogue
        </h1>
        <p className="text-gray-400 mt-3">
          Explore seat covers, lamination & steering designs
        </p>
      </div>

      {/* CATEGORIES */}
      <div className="grid md:grid-cols-3 gap-6">

        <Link href="/seat-covers">
          <div className="card p-8 text-center hover:scale-105 transition">
            <h2 className="text-2xl font-semibold">
              Car Seat Covers
            </h2>
          </div>
        </Link>

        <Link href="/floor-lamination">
          <div className="card p-8 text-center hover:scale-105 transition">
            <h2 className="text-2xl font-semibold">
              Floor Lamination
            </h2>
          </div>
        </Link>

        <Link href="/steering-covers">
          <div className="card p-8 text-center hover:scale-105 transition">
            <h2 className="text-2xl font-semibold">
              Steering Covers
            </h2>
          </div>
        </Link>

      </div>
    </div>
  );
}
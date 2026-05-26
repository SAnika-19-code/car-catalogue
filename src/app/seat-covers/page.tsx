"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function SeatCovers() {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "seat-covers"));
      setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">

      <h1 className="text-4xl font-bold mb-8">
        Car Seat Covers
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        {companies.map((c) => (
          <Link key={c.id} href={`/seat-covers/${c.id}`}>
            <div className="card p-6 hover:scale-105 transition">
              <h2 className="text-xl capitalize">
                {c.name}
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                {c.images?.length || 0} designs
              </p>
            </div>
          </Link>
        ))}

      </div>
    </div>
  );
}
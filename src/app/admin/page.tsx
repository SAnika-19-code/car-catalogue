"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";

import {
  collection,
  getDocs,
} from "firebase/firestore";

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const snap = await getDocs(
        collection(db, "seat-covers")
      );

      setCompanies(
        snap.docs.map((d) => d.data())
      );
    };

    fetchCompanies();
  }, []);

  const totalImages = companies.reduce(
    (acc, c) => acc + (c.images?.length || 0),
    0
  );

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-400 mt-1">
          Welcome to admin panel
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-gray-400">
            Companies
          </p>

          <h2 className="text-2xl">
            {companies.length}
          </h2>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-gray-400">
            Total Images
          </p>

          <h2 className="text-2xl">
            {totalImages}
          </h2>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-gray-400">
            Status
          </p>

          <h2 className="text-green-500">
            Active
          </h2>
        </div>

      </div>
    </div>
  );
}



"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function CompanyPage() {
  const params = useParams();
  const company = params?.company as string;

  const [data, setData] = useState<any>(null);

  // fullscreen index
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!company) return;

    const fetchData = async () => {
      const ref = doc(db, "seat-covers", company);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setData(snap.data());
      } else {
        setData(null);
      }
    };

    fetchData();
  }, [company]);

  const images = data?.images ?? [];

  /* ---------------- KEYBOARD CONTROL ---------------- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (!images.length) return;

      if (e.key === "Escape") {
        setSelectedIndex(null);
      }

      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev === null ? 0 : (prev + 1) % images.length
        );
      }

      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev === null
            ? 0
            : (prev - 1 + images.length) % images.length
        );
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, images.length]);

  /* ---------------- LOADING STATE ---------------- */
  if (!company || !data) {
    return (
      <div className="p-10 text-white bg-black min-h-screen">
        Loading...
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-black text-white p-10">

      {/* TITLE */}
      <h1 className="text-4xl font-bold mb-8 capitalize">
        {data.name}
      </h1>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img: string, index: number) => (
          <div
            key={img}
            className="cursor-pointer overflow-hidden rounded-xl"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={img}
              className="w-full h-56 object-cover hover:scale-110 transition duration-300"
            />
          </div>
        ))}
      </div>

      {/* FULLSCREEN */}
      {selectedIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">

          {/* close */}
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-5 right-5 text-white text-2xl"
          >
            ✕
          </button>

          {/* prev */}
          <button
            onClick={() =>
              setSelectedIndex(
                selectedIndex === 0
                  ? images.length - 1
                  : selectedIndex - 1
              )
            }
            className="absolute left-5 text-white text-4xl"
          >
            ‹
          </button>

          {/* image */}
          <img
            src={images[selectedIndex]}
            className="max-h-[85vh] max-w-[90vw] rounded-xl"
          />

          {/* next */}
          <button
            onClick={() =>
              setSelectedIndex(
                (selectedIndex + 1) % images.length
              )
            }
            className="absolute right-5 text-white text-4xl"
          >
            ›
          </button>

        </div>
      )}

    </div>
  );
}
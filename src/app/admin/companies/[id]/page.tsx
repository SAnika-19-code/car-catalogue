"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

/* ---------------- SORTABLE IMAGE ---------------- */
function SortableImage({
  img,
  selected,
  toggleSelect,
  onView,
}: any) {
  const { setNodeRef, transform, transition, attributes, listeners } =
    useSortable({ id: img });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative bg-zinc-900 rounded overflow-hidden"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 right-1 bg-black/70 text-xs px-2 py-1 cursor-grab z-10 text-white"
      >
        ⇅
      </div>

      <img
        src={img}
        onClick={onView}
        className={`h-24 w-full object-cover cursor-pointer ${
          selected ? "ring-2 ring-red-500" : ""
        }`}
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleSelect(img);
        }}
        className="w-full text-xs bg-black/80 text-white py-1"
      >
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function CompanyMediaManager() {
  const { id } = useParams();

  const [company, setCompany] = useState<any | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /* ---------------- FETCH ---------------- */
  const fetchCompany = async () => {
    const ref = doc(db, "seat-covers", id as string);
    const snap = await getDoc(ref);

    const data = snap.data() || {
      name: "",
      images: [],
      trash: [],
    };

    setCompany(data);
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  /* ---------------- SAFE DATA ---------------- */
  const images = company?.images || [];
  const trash = company?.trash || [];

  /* ---------------- UPLOAD ---------------- */
  const uploadImages = async () => {
    if (!files.length || !company) return;

    const urls: string[] = [];

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    await Promise.all(
      files.map(async (file) => {
        const form = new FormData();

        form.append("file", file);
        form.append("upload_preset", uploadPreset!);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: form,
          }
        );

        const data = await res.json();

        if (data.secure_url) {
          urls.push(data.secure_url);
        }
      })
    );

    const ref = doc(db, "seat-covers", id as string);

    await setDoc(
      ref,
      {
        ...company,
        images: [...images, ...urls],
      },
      { merge: true }
    );

    setFiles([]);
    fetchCompany();
  };

  /* ---------------- DELETE IMAGE ---------------- */
  const deleteImage = async (img: string) => {
    if (!company) return;

    const ok = confirm("Delete this image?");
    if (!ok) return;

    const ref = doc(db, "seat-covers", id as string);

    await setDoc(
      ref,
      {
        ...company,
        images: images.filter((i: string) => i !== img),
        trash: [...trash, img],
      },
      { merge: true }
    );

    fetchCompany();
  };

  /* ---------------- RESTORE ---------------- */
  const restoreImage = async (img: string) => {
    if (!company) return;

    const ref = doc(db, "seat-covers", id as string);

    await setDoc(
      ref,
      {
        ...company,
        images: [...images, img],
        trash: trash.filter((i: string) => i !== img),
      },
      { merge: true }
    );

    fetchCompany();
  };

  /* ---------------- EMPTY RECYCLE BIN (NEW) ---------------- */
  const emptyRecycleBin = async () => {
    if (!company) return;

    const first = confirm(
      "⚠️ This will permanently delete all images in recycle bin."
    );
    if (!first) return;

    const second = confirm("Are you 100% sure?");
    if (!second) return;

    const ref = doc(db, "seat-covers", id as string);

    await setDoc(
      ref,
      {
        ...company,
        trash: [],
      },
      { merge: true }
    );

    fetchCompany();
  };

  /* ---------------- BULK SELECT ---------------- */
  const toggleSelect = (img: string) => {
    setSelectedImages((prev) =>
      prev.includes(img)
        ? prev.filter((i) => i !== img)
        : [...prev, img]
    );
  };

  const bulkDelete = async () => {
    if (!company) return;

    const ref = doc(db, "seat-covers", id as string);

    const remaining = images.filter(
      (img: string) => !selectedImages.includes(img)
    );

    const moved = images.filter((img: string) =>
      selectedImages.includes(img)
    );

    await setDoc(
      ref,
      {
        ...company,
        images: remaining,
        trash: [...trash, ...moved],
      },
      { merge: true }
    );

    setSelectedImages([]);
    fetchCompany();
  };

  /* ---------------- DRAG ---------------- */
  const handleDrag = async (event: any) => {
    if (!company) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.indexOf(active.id);
    const newIndex = images.indexOf(over.id);

    const newOrder = arrayMove(images, oldIndex, newIndex);

    const ref = doc(db, "seat-covers", id as string);

    await setDoc(
      ref,
      {
        ...company,
        images: newOrder,
      },
      { merge: true }
    );

    fetchCompany();
  };

  /* ---------------- KEYBOARD NAV ---------------- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedImage) return;

      const index = images.indexOf(selectedImage);

      if (e.key === "Escape") setSelectedImage(null);

      if (e.key === "ArrowRight" && index < images.length - 1) {
        setSelectedImage(images[index + 1]);
      }

      if (e.key === "ArrowLeft" && index > 0) {
        setSelectedImage(images[index - 1]);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedImage, images]);

  /* ---------------- LOADING ---------------- */
  if (!company) {
    return <div className="text-white p-6">Loading...</div>;
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="text-white">

      <h1 className="text-3xl mb-4 capitalize">
        {company.name}
      </h1>

      {/* UPLOAD */}
      <div className="flex gap-2 mb-4">
        <input
          type="file"
          multiple
          onChange={(e) =>
            setFiles(Array.from(e.target.files || []))
          }
        />

        <button
          onClick={uploadImages}
          className="bg-blue-600 px-3 py-1 rounded"
        >
          Upload
        </button>

        <button
          onClick={bulkDelete}
          className="bg-red-600 px-3 py-1 rounded"
        >
          Delete Selected
        </button>
      </div>

      {/* GRID */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDrag}
      >
        <SortableContext
          items={images}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-4 gap-2">
            {images.map((img: string) => (
              <SortableImage
                key={img}
                img={img}
                selected={selectedImages.includes(img)}
                toggleSelect={toggleSelect}
                onView={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* RECYCLE BIN */}
      {trash.length > 0 && (
        <div className="mt-6">

          {/* HEADER + BUTTON */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gray-400">Recycle Bin</h2>

            <button
              onClick={emptyRecycleBin}
              className="bg-red-700 text-xs px-3 py-1 rounded"
            >
              Empty Bin
            </button>
          </div>

          {/* TRASH ITEMS */}
          <div className="grid grid-cols-4 gap-2">
            {trash.map((img: string) => (
              <div key={img} className="relative">
                <img
                  src={img}
                  className="h-20 w-full object-cover opacity-60"
                />

                <button
                  onClick={() => restoreImage(img)}
                  className="absolute bottom-1 left-1 bg-green-600 text-xs px-2 py-1 rounded"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-5 right-5 text-3xl"
          >
            ✕
          </button>

          <img
            src={selectedImage}
            className="max-h-[90vh] max-w-[90vw]"
          />
        </div>
      )}
    </div>
  );
}
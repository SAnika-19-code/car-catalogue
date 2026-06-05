"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db } from "@/firebase/config";
import type {
  CatalogueCategory,
  CompanyDocument,
  GalleryDocument,
} from "@/catalogue/categories";

type SortableImageProps = {
  image: string;
  index: number;
  selected: boolean;
  onSelect: (image: string) => void;
  onView: (image: string) => void;
};

function SortableImage({
  image,
  index,
  selected,
  onSelect,
  onView,
}: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative overflow-hidden rounded-lg border bg-[#0b1020] ${
        selected ? "border-red-400" : "border-[#d0ab4f]/25"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute right-1 top-1 z-10 rounded bg-black/70 px-2 py-1 text-xs text-white"
        aria-label={`Move design ${index + 1}`}
      >
        Move
      </button>

      <button type="button" onClick={() => onView(image)} className="w-full">
        <img
          src={image}
          alt={`Design ${index + 1}`}
          className="h-24 w-full object-cover"
        />
      </button>

      <button
        type="button"
        onClick={() => onSelect(image)}
        className="w-full bg-[#1d2a4b] py-1 text-xs font-semibold text-white"
      >
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

type AdminGalleryManagerProps = {
  category: CatalogueCategory;
  companyId?: string;
};

export function AdminGalleryManager({
  category,
  companyId,
}: AdminGalleryManagerProps) {
  const router = useRouter();
  const documentRef = useMemo(
    () =>
      category.mode === "grouped" && companyId
        ? doc(db, category.collection, companyId)
        : doc(db, "catalogues", category.collection),
    [category.collection, category.mode, companyId]
  );

  const [gallery, setGallery] = useState<GalleryDocument | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadGallery = useCallback(() => {
    getDoc(documentRef)
      .then((snapshot) => {
        const data = snapshot.data() as Partial<GalleryDocument> | undefined;
        setGallery({
          name: data?.name ?? category.title,
          images: data?.images ?? [],
          trash: data?.trash ?? [],
        });
        setNewName(data?.name ?? category.title);
      })
      .finally(() => setLoading(false));
  }, [category.title, documentRef]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const images = gallery?.images ?? [];
  const trash = gallery?.trash ?? [];

  const saveGallery = async (nextGallery: GalleryDocument) => {
    await setDoc(documentRef, nextGallery, { merge: true });
    setGallery(nextGallery);
  };

  const uploadImages = async () => {
    if (!files.length || !gallery) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary settings are missing.");
      return;
    }

    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", uploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: form,
          }
        );

        const data = (await response.json()) as { secure_url?: string };
        return data.secure_url;
      })
    );

    const nextImages = uploadedUrls.filter((url): url is string => Boolean(url));
    await saveGallery({
      ...gallery,
      images: [...images, ...nextImages],
    });
    setFiles([]);
  };

  const toggleSelect = (image: string) => {
    setSelectedImages((current) =>
      current.includes(image)
        ? current.filter((item) => item !== image)
        : [...current, image]
    );
  };

  const bulkDelete = async () => {
    if (!gallery || selectedImages.length === 0) return;

    const remaining = images.filter((image) => !selectedImages.includes(image));
    const moved = images.filter((image) => selectedImages.includes(image));

    await saveGallery({
      ...gallery,
      images: remaining,
      trash: [...trash, ...moved],
    });
    setSelectedImages([]);
  };

  const restoreImage = async (image: string) => {
    if (!gallery) return;

    await saveGallery({
      ...gallery,
      images: [...images, image],
      trash: trash.filter((item) => item !== image),
    });
  };

  const emptyRecycleBin = async () => {
    if (!gallery) return;

    const first = confirm(
      "This will permanently remove every image from the recycle bin."
    );
    if (!first) return;

    const second = confirm("Are you sure?");
    if (!second) return;

    await saveGallery({
      ...gallery,
      trash: [],
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!gallery) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.indexOf(String(active.id));
    const newIndex = images.indexOf(String(over.id));
    const nextImages = arrayMove(images, oldIndex, newIndex);

    await saveGallery({
      ...gallery,
      images: nextImages,
    });
  };

  const renameGallery = async () => {
    if (!gallery) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("Enter a name.");
      return;
    }

    if (category.mode === "flat") {
      await saveGallery({ ...gallery, name: trimmedName });
      return;
    }

    if (!companyId) return;

    const newId = trimmedName.toLowerCase().replace(/\s+/g, "-");
    if (newId === companyId) {
      await saveGallery({ ...gallery, name: trimmedName });
      return;
    }

    const ok = confirm(`Rename "${gallery.name}" to "${trimmedName}"?`);
    if (!ok) return;

    await setDoc(doc(db, category.collection, newId), {
      ...gallery,
      name: trimmedName,
    });
    await deleteDoc(doc(db, category.collection, companyId));
    router.replace(`/admin/categories/${category.slug}/${newId}`);
  };

  if (loading || !gallery) {
    return <div className="text-white/65">Loading...</div>;
  }

  return (
    <div className="text-white">
      <h1 className="mb-4 text-3xl font-bold capitalize">{gallery.name}</h1>

      <section className="mb-6 rounded-lg border border-[#d0ab4f]/25 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-semibold text-[#d0ab4f]">
          Gallery Settings
        </h2>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Gallery name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className="flex-1 rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] px-3 py-2 text-white outline-none focus:border-[#d0ab4f]"
          />

          <button
            type="button"
            onClick={renameGallery}
            className="rounded-lg bg-[#d0ab4f] px-4 py-2 font-semibold text-[#10182f] hover:bg-[#ead59a]"
          >
            Save Name
          </button>
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="file"
          multiple
          onChange={(event) =>
            setFiles(Array.from(event.target.files ?? []))
          }
          className="rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] p-2 text-sm text-white"
        />

        <button
          type="button"
          onClick={uploadImages}
          className="rounded-lg bg-[#d0ab4f] px-3 py-2 font-semibold text-[#10182f]"
        >
          Upload
        </button>

        <button
          type="button"
          onClick={bulkDelete}
          className="rounded-lg bg-red-600 px-3 py-2 font-semibold text-white"
        >
          Delete Selected
        </button>
      </section>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {images.map((image, index) => (
              <SortableImage
                key={`${image}-${index}`}
                image={image}
                index={index}
                selected={selectedImages.includes(image)}
                onSelect={toggleSelect}
                onView={setSelectedImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {trash.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[#d0ab4f]">Recycle Bin</h2>

            <button
              type="button"
              onClick={emptyRecycleBin}
              className="rounded-lg bg-red-700 px-3 py-1 text-xs text-white"
            >
              Empty Bin
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {trash.map((image, index) => (
              <div key={`${image}-${index}`} className="relative overflow-hidden rounded-lg border border-[#d0ab4f]/20">
                <img
                  src={image}
                  alt={`Deleted design ${index + 1}`}
                  className="h-20 w-full object-cover opacity-60"
                />

                <button
                  type="button"
                  onClick={() => restoreImage(image)}
                  className="absolute bottom-1 left-1 rounded bg-green-600 px-2 py-1 text-xs text-white"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedImage && (
        <div className="lightbox">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="lightbox-control lightbox-close"
            aria-label="Close image viewer"
          >
            x
          </button>

          <img
            src={selectedImage}
            alt="Selected design"
            className="lightbox-image"
          />
        </div>
      )}
    </div>
  );
}

type AdminCompanyListProps = {
  category: CatalogueCategory;
};

export function AdminCompanyList({ category }: AdminCompanyListProps) {
  const [companies, setCompanies] = useState<CompanyDocument[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCompanies = useCallback(() => {
    getDocs(collection(db, category.collection))
      .then((snapshot) => {
        setCompanies(
          snapshot.docs.map((item) => {
            const data = item.data() as Partial<CompanyDocument>;
            return {
              id: item.id,
              name: data.name ?? item.id,
              images: data.images ?? [],
              trash: data.trash ?? [],
            };
          })
        );
      })
      .finally(() => setLoading(false));
  }, [category.collection]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const addCompany = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = trimmedName.toLowerCase().replace(/\s+/g, "-");

    await setDoc(doc(db, category.collection, id), {
      name: trimmedName,
      images: [],
      trash: [],
    });

    setName("");
    loadCompanies();
  };

  const deleteCompany = async (company: CompanyDocument) => {
    const input = prompt(`Type "${company.name}" to confirm`);
    if (input !== company.name) return;

    await deleteDoc(doc(db, category.collection, company.id));
    loadCompanies();
  };

  return (
    <div className="text-white">
      <div className="mb-6 border-b border-[#d0ab4f]/25 pb-4">
        <h1 className="text-3xl font-bold">{category.title}</h1>
        <p className="mt-1 text-white/65">Manage company-wise galleries.</p>
      </div>

      <div className="mb-6 flex flex-col gap-2 md:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] p-2 text-white outline-none focus:border-[#d0ab4f]"
          placeholder="Add company"
        />

        <button
          type="button"
          onClick={addCompany}
          className="rounded-lg bg-[#d0ab4f] px-3 py-2 font-semibold text-[#10182f]"
        >
          Add
        </button>
      </div>

      {loading ? (
        <div className="text-white/65">Loading...</div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between rounded-lg border border-[#d0ab4f]/20 bg-white/10 p-4"
            >
              <a
                href={`/admin/categories/${category.slug}/${company.id}`}
                className="capitalize hover:text-[#d0ab4f]"
              >
                {company.name}
              </a>

              <button
                type="button"
                onClick={() => deleteCompany(company)}
                className="font-semibold text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

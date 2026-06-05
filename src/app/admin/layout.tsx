"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { catalogueCategories } from "@/catalogue/categories";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";

type NavItemProps = {
  href: string;
  label: string;
  active: boolean;
};

function NavItem({ href, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`block rounded-lg p-3 text-sm font-semibold transition ${
        active
          ? "bg-[#d0ab4f] text-[#10182f]"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();

  return (
    <AdminAuthGate>
      <div className="flex min-h-screen bg-[#111a33] text-white">
        <aside className="w-64 border-r border-[#d0ab4f]/25 bg-[#0b1020] p-4">
          <h1 className="mb-6 text-xl font-bold text-[#d0ab4f]">
            Admin Panel
          </h1>

          <nav className="space-y-2">
            <NavItem href="/admin" label="Dashboard" active={path === "/admin"} />
            <NavItem
              href="/admin/categories"
              label="Categories"
              active={path === "/admin/categories"}
            />

            <div className="pt-4">
              <p className="mb-2 px-3 text-xs font-bold uppercase text-[#d0ab4f]">
                Galleries
              </p>
              {catalogueCategories.map((category) => (
                <NavItem
                  key={category.slug}
                  href={`/admin/categories/${category.slug}`}
                  label={category.title}
                  active={path.startsWith(`/admin/categories/${category.slug}`)}
                />
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6 pr-28">{children}</main>
      </div>
    </AdminAuthGate>
  );
}

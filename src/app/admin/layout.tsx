"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();

  const Item = ({ href, label }: any) => (
    <Link
      href={href}
      className={`block p-3 rounded ${
        path === href ? "bg-white text-black" : "text-white hover:bg-zinc-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* SIDEBAR */}
      <div className="w-64 bg-zinc-950 p-4 space-y-2">
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

        <Item href="/admin" label="Dashboard" />
        <Item href="/admin/companies" label="Companies" />
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
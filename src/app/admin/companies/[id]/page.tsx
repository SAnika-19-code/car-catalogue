import { redirect } from "next/navigation";

export default async function OldCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/categories/seat-covers/${id}`);
}

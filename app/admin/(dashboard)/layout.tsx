import { AdminAuthGate } from "@/app/admin/components/AdminAuthGate";

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminAuthGate>{children}</AdminAuthGate>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | PharmaOpenings",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-1 flex-col bg-[var(--color-po-lavender)] text-[var(--color-po-navy)]">
      {children}
    </div>
  );
}

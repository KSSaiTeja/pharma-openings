import type { Metadata } from "next";

import "./admin.css";

export const metadata: Metadata = {
  title: "Admin | PharmaOpenings",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="po-admin flex min-h-dvh min-w-0 flex-1 flex-col"
      style={{
        background:
          "linear-gradient(180deg, var(--po-admin-bg-top, #f4f8f5) 0%, var(--po-admin-bg-bottom, #fafcf9) 45%, #ffffff 100%)",
      }}
    >
      {children}
    </div>
  );
}

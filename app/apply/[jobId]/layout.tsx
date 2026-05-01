import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply | PharmaOpenings",
  description: "Submit your application for this role on PharmaOpenings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ApplyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | PharmaOpenings",
  description: "Manage your PharmaOpenings candidate profile and review your applications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

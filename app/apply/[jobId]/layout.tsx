export default function ApplyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="po-auth-layout-root">{children}</div>;
}

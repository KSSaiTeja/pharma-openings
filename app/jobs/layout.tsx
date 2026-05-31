export default function JobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="po-jobs-layout-root">{children}</div>;
}

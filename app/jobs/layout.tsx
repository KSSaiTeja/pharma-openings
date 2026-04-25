export default function JobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#faf8ff] text-[#1e1b36] antialiased">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-15%,rgba(109,106,232,0.11),transparent_52%)]"
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

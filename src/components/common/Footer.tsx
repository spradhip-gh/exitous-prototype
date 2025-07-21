export default function Footer() {
  const version = "0.1-20240718";
  return (
    <footer className="py-4 px-4 text-sm text-muted-foreground border-t flex justify-between items-center">
      <span>Patent Pending by Exitous 2025</span>
      <span>Prototype {version}</span>
    </footer>
  );
}

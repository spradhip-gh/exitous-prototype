import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Exitous Logo"
            width={120}
            height={31}
            priority
          />
        </Link>
      </div>
    </header>
  );
}

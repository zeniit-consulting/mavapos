import Image from "next/image";

export function MavaLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/2.png"
      alt="MAVA"
      width={120}
      height={48}
      className={`block object-contain ${className}`}
      draggable={false}
    />
  );
}

export function LoginLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/3.png"
      alt="MAVA"
      width={160}
      height={64}
      className={`block object-contain ${className}`}
      priority
      draggable={false}
    />
  );
}

export function SplashScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0369a1] px-8">
      <LoginLogo className="h-auto w-[min(68vw,360px)]" />
    </main>
  );
}

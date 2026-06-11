import MavaposShell from "@/components/mavapos/mavapos-shell";

export default function LoginPage() {
  return (
    <MavaposShell
      initialMenu="Dashboard"
      initialAuthReady
      initialShowSplash={false}
    />
  );
}

import { NameSpinner } from "@/components/name-spinner";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8">Wheel of Tim</h1>
        <NameSpinner />
      </div>
    </main>
  );
}


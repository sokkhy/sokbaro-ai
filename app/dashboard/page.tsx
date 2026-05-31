import type { Metadata } from "next";
import Link from "next/link";
import DashboardClient from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard · SokBaro AI",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between">
        <h1 className="text-2xl font-bold">Your posture</h1>
        <Link
          href="/monitor"
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
        >
          New session
        </Link>
      </div>
      <DashboardClient />
    </main>
  );
}

import type { Metadata } from "next";
import MonitorClient from "@/components/MonitorClient";

export const metadata: Metadata = {
  title: "Monitor · SokBaro AI",
};

export default function MonitorPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto mb-8 max-w-3xl">
        <h1 className="text-2xl font-bold">Posture check</h1>
        <p className="mt-1 text-sm text-white/60">
          Sit normally for a few seconds while we calibrate, then keep your
          score above 70. Everything runs locally in your browser.
        </p>
      </div>
      <MonitorClient />
    </main>
  );
}

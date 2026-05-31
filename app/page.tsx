import Link from "next/link";

const FEATURES = [
  {
    title: "Real-time posture detection",
    body: "Tracks your head, neck, shoulders, and distance from the screen as you work.",
  },
  {
    title: "Gentle, timely alerts",
    body: "If you slouch or lean in for too long, SokBaro nudges you to sit up straight.",
  },
  {
    title: "Daily posture score",
    body: "End each session with a 0–100 score and watch your habits improve over time.",
  },
  {
    title: "Private by design",
    body: "Your camera feed is processed entirely in your browser. No video is ever uploaded.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          SokBaro AI
        </span>
        <h1 className="mt-6 text-5xl font-bold leading-tight sm:text-6xl">
          Sit Better.
          <br />
          Work Better.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/60">
          Your AI posture coach. SokBaro watches your sitting posture through
          your webcam and helps you stay healthy while you work — no wearable,
          no extra hardware, just your camera.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/monitor"
            className="rounded-full bg-emerald-500 px-8 py-3 text-base font-semibold text-black transition hover:bg-emerald-400"
          >
            Start posture check
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/15 px-8 py-3 text-base font-semibold text-white/80 transition hover:bg-white/5"
          >
            View dashboard
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl grid-cols-1 gap-4 px-4 pb-24 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-white/60">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

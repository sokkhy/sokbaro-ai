import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · SokBaro AI",
  description:
    "How SokBaro AI handles camera data, posture metrics, and Chrome extension permissions.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-12 text-white">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
        >
          SokBaro AI
        </Link>
        <h1 className="mt-6 text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-white/50">Last updated: June 3, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-white/70">
          <section>
            <h2 className="text-xl font-semibold text-white">Local processing</h2>
            <p className="mt-3">
              SokBaro AI uses your camera only after you grant permission. Camera
              frames are processed on your device with MediaPipe pose detection
              and are discarded immediately. SokBaro AI does not upload,
              transmit, sell, or share raw camera frames, images, or video.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Chrome extension</h2>
            <p className="mt-3">
              The extension runs posture detection in an offscreen extension
              document so it can monitor posture while you work in other tabs.
              It injects an on-page banner only to show posture alerts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Stored data</h2>
            <p className="mt-3">
              If optional Firebase history is configured in a deployment of the
              web app, SokBaro AI may store derived posture session metrics,
              such as average score, percent of good posture time, alert count,
              and timestamps. These metrics are used only to show your posture
              history.
            </p>
            <p className="mt-3">
              The Chrome extension stores local settings and monitoring state in
              Chrome extension storage. This data stays on your device unless
              Chrome sync is enabled for your browser profile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Website access</h2>
            <p className="mt-3">
              The Chrome extension requests broad website access so it can
              display posture alert banners on the pages you are using. SokBaro
              AI does not collect browsing history, page contents, form entries,
              passwords, or cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Third parties</h2>
            <p className="mt-3">
              SokBaro AI uses MediaPipe Tasks Vision for local pose detection.
              Optional history storage uses Firebase if configured by the
              deployment owner. SokBaro AI does not use user data for
              advertising, does not sell user data, and does not transfer user
              data to data brokers or advertising platforms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              Chrome Web Store User Data Policy
            </h2>
            <p className="mt-3">
              The use of information received from Google APIs will adhere to
              the Chrome Web Store User Data Policy, including the Limited Use
              requirements.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

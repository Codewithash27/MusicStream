import type { ReactElement } from "react";

import { Button } from "../components/common/button";
import { Input } from "../components/common/input";
import { PageHeader } from "../components/common/section-header";

export function SettingsPage(): ReactElement {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences." />

      <div className="space-y-6">
        <section className="rounded-2xl border border-ms-border bg-ms-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Account</h2>
          <div className="space-y-4">
            <Input label="Email" defaultValue="alex@musicstream.app" />
            <Input label="Username" defaultValue="alex_r" />
            <Button variant="secondary">Update account</Button>
          </div>
        </section>

        <section className="rounded-2xl border border-ms-border bg-ms-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Playback</h2>
          <div className="space-y-4 text-sm">
            {[
              ["Normalize volume", true],
              ["Autoplay similar songs", true],
              ["Show explicit content", false],
              ["Offline downloads on Wi‑Fi only", true],
            ].map(([label, checked]) => (
              <label key={String(label)} className="flex items-center justify-between gap-4">
                <span>{label}</span>
                <input
                  type="checkbox"
                  defaultChecked={Boolean(checked)}
                  className="h-4 w-4 accent-ms-primary"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ms-border bg-ms-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Danger zone</h2>
          <p className="mb-4 text-sm text-ms-muted">
            Deleting your account removes playlists and uploaded tracks.
          </p>
          <Button variant="danger">Delete account</Button>
        </section>
      </div>
    </div>
  );
}

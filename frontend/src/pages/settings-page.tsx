import { type ChangeEvent, type ReactElement, useId, useRef, useState } from "react";

import { getApiErrorMessage } from "../api/client";
import { Avatar } from "../components/common/avatar";
import { Button } from "../components/common/button";
import { Input } from "../components/common/input";
import { PageHeader } from "../components/common/section-header";
import { useMeQuery } from "../features/auth/hooks";
import { useDeleteAvatarMutation, useUploadAvatarMutation } from "../features/users/hooks";
import { useAuthStore } from "../store/auth.store";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function SettingsPage(): ReactElement {
  useMeQuery();
  const user = useAuthStore((s) => s.user);
  const uploadAvatar = useUploadAvatarMutation();
  const deleteAvatar = useDeleteAvatarMutation();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Avatar must be JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Avatar must be under 5MB.");
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      setMessage("Avatar updated.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Avatar upload failed"));
    }
  };

  const onRemoveAvatar = async () => {
    setMessage(null);
    setError(null);
    try {
      await deleteAvatar.mutateAsync();
      setMessage("Avatar removed.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not remove avatar"));
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences." />

      <div className="space-y-6">
        <section className="rounded-2xl border border-ms-border bg-ms-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Profile photo</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar
              name={user?.display_name ?? "User"}
              imageUrl={user?.avatar_url}
              size="lg"
              className="h-20 w-20 text-2xl"
            />
            <div className="space-y-2">
              <input
                ref={fileRef}
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onAvatarChange(e)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploadAvatar.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadAvatar.isPending ? "Uploading…" : "Upload avatar"}
                </Button>
                {user?.avatar_url ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deleteAvatar.isPending}
                    onClick={() => void onRemoveAvatar()}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-ms-muted">JPEG, PNG, or WebP · max 5MB</p>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-ms-danger">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-ms-primary">{message}</p> : null}
        </section>

        <section className="rounded-2xl border border-ms-border bg-ms-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Account</h2>
          <div className="space-y-4">
            <Input label="Email" value={user?.email ?? ""} readOnly />
            <Input label="Username" value={user?.username ?? ""} readOnly />
            <Input label="Display name" value={user?.display_name ?? ""} readOnly />
            <Input label="Role" value={user?.role ?? ""} readOnly />
            <p className="text-xs text-ms-muted">
              Profile field editing is not available yet — avatar upload is live via the API.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-ms-border bg-ms-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Playback</h2>
          <div className="space-y-4 text-sm">
            {[
              ["Normalize volume", true],
              ["Autoplay similar songs", true],
              ["Show explicit content", false],
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
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "../../api/client";
import { api } from "../../api/endpoints";
import type { User } from "../../types/models";

interface ProfileHeroProps {
  user: User;
  memberSince: string;
}

/**
 * No avatar image or bio field exists on `User` (CONTRACTS §2) — the
 * Stitch mock's portrait/quote are replaced with an initial-letter circle
 * (same pattern as Header.tsx) and a real "member since" line.
 *
 * "Edit Profile" is wired to a real PATCH /users/me for the one field the
 * backend actually lets you rename — `name`. "Settings" has no backend
 * screen behind it yet and stays a plain, unwired button.
 */
export default function ProfileHero({ user, memberSince }: ProfileHeroProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);

  const updateName = useMutation({
    mutationFn: () => api.users.updateMe({ name }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["users", "me"], updated);
      setEditing(false);
    },
  });

  return (
    <section className="flex flex-col md:flex-row gap-12 items-start">
      <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shrink-0 shadow-xl border-4 border-surface-container-lowest bg-primary flex items-center justify-center">
        <span className="font-display-xl text-display-xl text-on-primary">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col pt-4 w-full">
        <div className="font-label-sm tracking-[0.2em] text-on-surface-variant uppercase mb-4 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-outline-variant" />
          Your Travel Profile
        </div>

        {editing ? (
          <div className="flex items-center gap-3 mb-6">
            <input
              className="font-display-xl text-display-xl-mobile bg-transparent border-b-2 border-primary focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={255}
            />
          </div>
        ) : (
          <h1 className="font-display-xl text-display-xl-mobile md:text-display-xl mb-6">
            {user.name}
          </h1>
        )}

        <p className="font-body-lg text-on-surface-variant max-w-2xl mb-8">
          {memberSince} · {user.email}
        </p>

        {updateName.isError && (
          <p className="font-body-md text-body-md text-on-error-container bg-error-container px-4 py-2 rounded-lg mb-4 max-w-md">
            {updateName.error instanceof ApiError
              ? updateName.error.detail
              : "Could not save that change."}
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => updateName.mutate()}
                disabled={updateName.isPending || name.trim().length === 0}
                className="px-8 py-3 bg-premium-navy text-background-cream font-label-lg rounded-full hover:bg-primary transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">check</span>
                {updateName.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(user.name);
                }}
                className="px-8 py-3 bg-glass-white border border-outline-variant/30 text-premium-navy font-label-lg rounded-full hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-8 py-3 bg-premium-navy text-background-cream font-label-lg rounded-full hover:bg-primary transition-colors flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">
                edit
              </span>
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

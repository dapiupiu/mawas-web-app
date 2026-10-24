import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, Camera, LockKeyhole, UserRound, X } from "lucide-react";
import { authApi, type StoredUser } from "@/lib/api";

interface ProfileSettingsModalProps {
  user: StoredUser;
  onClose: () => void;
  onSaved: (user: StoredUser) => void;
}

export function ProfileSettingsModal({ user, onClose, onSaved }: ProfileSettingsModalProps) {
  const [name, setName] = useState(user.name || user.username || "");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    if (password && password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (photo && (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 5 * 1024 * 1024)) {
      setError("Pilih foto JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.");
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = user.avatar_url || null;
      if (photo) avatarUrl = await authApi.uploadAvatar(photo);
      const updated = await authApi.updateProfile({ nama: normalizedName, avatar_url: avatarUrl || undefined });
      onSaved({
        ...user,
        name: updated.nama,
        username: updated.nama,
        avatar_url: updated.avatar_url,
        role: updated.role,
      });
      if (password) await authApi.changePassword(password);
      onClose();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Profil gagal diperbarui.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-end bg-[#091b15]/65 p-0 backdrop-blur-xs sm:place-items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
        className="w-full max-w-lg rounded-t-2xl border border-[#173e32]/20 bg-[#fbfaf6] shadow-2xl sm:rounded-xl"
      >
        <header className="flex items-center justify-between border-b border-[#173e32]/10 bg-white px-5 py-4">
          <div>
            <h2 id="profile-settings-title" className="font-serif text-lg font-bold text-[#173e32]">Pengaturan Profil</h2>
            <p className="text-xs text-[#557267]">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-lg text-[#36564a] hover:bg-[#dce7d7]" aria-label="Tutup pengaturan profil">
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#991b1b]/20 bg-[#fee2e2] p-3 text-xs text-[#991b1b]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <label className="block text-xs font-bold text-[#173e32]" htmlFor="profile-name">
            Nama tampilan
            <span className="relative mt-1 block">
              <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
              <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required className="min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white pl-9 pr-3 text-sm font-normal text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]" />
            </span>
          </label>

          <label className="block text-xs font-bold text-[#173e32]" htmlFor="profile-photo">
            Foto profil
            <span className="mt-1 flex min-h-11 items-center gap-2 rounded-lg border border-[#173e32]/20 bg-white px-3 text-xs font-normal text-[#557267]">
              <Camera className="size-4 shrink-0" />
              <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} className="min-w-0 flex-1 file:mr-3 file:rounded-md file:border-0 file:bg-[#dce7d7] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-[#173e32]" />
            </span>
            <span className="mt-1 block font-normal text-[#557267]">JPG, PNG, WebP; maksimal 5 MB.</span>
          </label>

          <label className="block text-xs font-bold text-[#173e32]" htmlFor="profile-password">
            Password baru <span className="font-normal text-[#557267]">(opsional)</span>
            <span className="relative mt-1 block">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
              <input id="profile-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} className="min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white pl-9 pr-3 text-sm font-normal text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]" />
            </span>
          </label>

          <div className="flex justify-end gap-2 border-t border-[#173e32]/10 pt-4">
            <button type="button" onClick={onClose} className="min-h-10 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7]">Batal</button>
            <button type="submit" disabled={saving} className="min-h-10 rounded-lg bg-[#173e32] px-5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] disabled:opacity-60">
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

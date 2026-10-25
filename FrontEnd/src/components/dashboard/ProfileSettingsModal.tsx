import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, FileImage, ImagePlus, LockKeyhole, UserRound, X } from "lucide-react";
import type { DashboardNotice } from "@/types/dashboard";
import { authApi, type StoredUser } from "@/lib/api";
import { ModalPortal } from "./ModalPortal";

interface ProfileSettingsModalProps {
  user: StoredUser;
  onClose: () => void;
  onSaved: (user: StoredUser) => void;
  onNotify: (notice: DashboardNotice) => void;
}

export function ProfileSettingsModal({ user, onClose, onSaved, onNotify }: ProfileSettingsModalProps) {
  const [name, setName] = useState(user.name || user.username || "");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const clearPhoto = () => {
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const normalizedName = name.trim();
    if (!normalizedName) {
      const message = "Nama tampilan wajib diisi.";
      setError(message);
      onNotify({ success: false, message });
      return;
    }
    if (password && password.length < 8) {
      const message = "Kata sandi baru harus terdiri dari minimal 8 karakter.";
      setError(message);
      onNotify({ success: false, message });
      return;
    }
    if (photo && (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 5 * 1024 * 1024)) {
      const message = "Pilih foto JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.";
      setError(message);
      onNotify({ success: false, message });
      return;
    }

    setSaving(true);
    let profileSaved = false;
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
      profileSaved = true;
      if (password) await authApi.changePassword(password);
      onNotify({
        success: true,
        message: password
          ? "Profil dan kata sandi berhasil diperbarui."
          : "Profil berhasil diperbarui.",
      });
      onClose();
    } catch {
      const message = profileSaved
        ? "Profil berhasil diperbarui, tetapi kata sandi belum berubah. Silakan coba lagi."
        : "Profil belum berhasil diperbarui. Periksa data dan coba kembali.";
      setError(message);
      onNotify({ success: false, message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[#091b15]/65 p-4 backdrop-blur-xs"
        role="presentation"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-settings-title"
          className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#173e32]/20 bg-[#fbfaf6] shadow-2xl"
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

          <div>
            <label className="block text-xs font-bold text-[#173e32]" htmlFor="profile-photo">
              Foto profil
            </label>
            <input
              ref={photoInputRef}
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={(event) => setPhoto(event.target.files?.[0] || null)}
              className="sr-only"
            />
            <div className="mt-1.5 flex min-h-14 items-center gap-3 rounded-lg border border-dashed border-[#173e32]/25 bg-white p-2.5 transition-colors hover:border-[#10b981]/60">
              <label
                htmlFor="profile-photo"
                className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#dce7d7] px-3.5 text-xs font-bold text-[#173e32] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#c9dcc5] hover:shadow-md focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#10b981] has-[:disabled]:pointer-events-none has-[:disabled]:opacity-60"
              >
                <ImagePlus className="size-4" />
                <span>{photo ? "Ganti foto" : "Pilih foto"}</span>
              </label>
              <div className="min-w-0 flex-1">
                {photo ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-[#173e32]">
                    <FileImage className="size-4 shrink-0 text-[#10b981]" />
                    <span className="truncate">{photo.name}</span>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      disabled={saving}
                      className="ml-auto grid size-7 shrink-0 place-items-center rounded-md text-[#557267] transition-colors hover:bg-[#fee2e2] hover:text-[#991b1b] disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Batalkan pilihan foto"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#557267]">
                    {user.avatar_url ? "Foto profil saat ini digunakan" : "Belum ada foto dipilih"}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 text-[11px] font-normal text-[#557267]">
              JPG, PNG, atau WebP · maksimal 5 MB.
            </p>
          </div>

          <label className="block text-xs font-bold text-[#173e32]" htmlFor="profile-password">
            Password baru <span className="font-normal text-[#557267]">(opsional)</span>
            <span className="relative mt-1 block">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
              <input id="profile-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white pl-9 pr-3 text-sm font-normal text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]" />
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
    </ModalPortal>
  );
}

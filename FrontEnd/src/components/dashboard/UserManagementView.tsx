import { useState, useMemo } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  Copy, 
  Check, 
  Search, 
  Trash2, 
  X, 
  UserCheck, 
  AlertCircle,
  RefreshCw,
  Lock,
  Mail,
  User,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { ManagedUser } from "@/types/dashboard";
import type { DashboardNotice } from "@/types/dashboard";
import { authApi } from "@/lib/api";
import { ModalPortal } from "./ModalPortal";

interface UserManagementViewProps {
  users: ManagedUser[];
  onUsersChange: Dispatch<SetStateAction<ManagedUser[]>>;
  isLoading: boolean;
  loadError?: string | null;
  onNotify: (notice: DashboardNotice) => void;
}

export function UserManagementView({ users, onUsersChange, isLoading, loadError, onNotify }: UserManagementViewProps) {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingActions, setPendingActions] = useState<Record<string, "status" | "password">>({});

  // Form states for new user registration
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdSummary, setCreatedSummary] = useState<ManagedUser | null>(null);

  const generateDummyPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Mawas#${rand}!`;
  };

  const openCreateModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword(generateDummyPassword());
    setErrorMsg(null);
    setCreatedSummary(null);
    setModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = query.toLowerCase().trim();
      return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, query]);

  const handleCopyPassword = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id: string) => {
    if (pendingActions[id]) return;
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const nextStatus = target.status === "aktif" ? "nonaktif" : "aktif";
    setErrorMsg(null);
    setPendingActions((current) => ({ ...current, [id]: "status" }));
    onUsersChange((current) => current.map((user) => user.id === id ? { ...user, status: nextStatus } : user));
    try {
      const updatedUser = await authApi.updateOperator(id, {
        status: nextStatus,
      });
      onUsersChange((current) => current.map((user) => user.id === id ? updatedUser : user));
      onNotify({
        success: true,
        message: nextStatus === "aktif" ? "Akun operator berhasil diaktifkan." : "Akun operator berhasil dinonaktifkan.",
      });
    } catch {
      onUsersChange((current) => current.map((user) => user.id === id ? { ...user, status: target.status } : user));
      const message = "Status akun belum berhasil diperbarui. Silakan coba lagi.";
      setErrorMsg(message);
      onNotify({ success: false, message });
    } finally {
      setPendingActions((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  const handleResetPassword = async (id: string) => {
    if (pendingActions[id]) return;
    const newPw = generateDummyPassword();
    setErrorMsg(null);
    setPendingActions((current) => ({ ...current, [id]: "password" }));
    try {
      const savedPassword = await authApi.resetOperatorPassword(id, newPw);
      onUsersChange((current) => current.map((user) => user.id === id ? { ...user, temporaryPassword: savedPassword } : user));
      onNotify({ success: true, message: "Kata sandi sementara berhasil diperbarui." });
    } catch {
      const message = "Kata sandi sementara belum berhasil diperbarui. Silakan coba lagi.";
      setErrorMsg(message);
      onNotify({ success: false, message });
    } finally {
      setPendingActions((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    setErrorMsg(null);
    setIsDeleting(true);
    try {
      await authApi.deleteOperator(id);
      onUsersChange((current) => current.filter((user) => user.id !== id));
      setDeleteId(null);
      onNotify({ success: true, message: "Akun operator berhasil dihapus." });
    } catch {
      const message = "Akun operator belum berhasil dihapus. Silakan coba lagi.";
      setErrorMsg(message);
      onNotify({ success: false, message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitNewUser = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const email = formEmail.trim().toLowerCase();
    const name = formName.trim();
    const password = formPassword.trim();

    if (!email || !password) {
      setErrorMsg("Email dan password wajib diisi.");
      onNotify({ success: false, message: "Email dan kata sandi wajib diisi." });
      setIsSubmitting(false);
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === email)) {
      setErrorMsg("Email ini sudah terdaftar di sistem.");
      onNotify({ success: false, message: "Email tersebut sudah terdaftar. Gunakan email lain." });
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = await authApi.createOperator({ email, password, ...(name ? { nama: name } : {}) });
      onUsersChange((current) => [newUser, ...current]);
      setCreatedSummary(newUser);
      onNotify({ success: true, message: "Akun operator berhasil didaftarkan." });
    } catch {
      const message = "Akun operator belum berhasil didaftarkan. Periksa kembali data dan coba lagi.";
      setErrorMsg(message);
      onNotify({ success: false, message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = "Operator Lapangan";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-xl border border-[#173e32]/15 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10b981]">
              <Users className="size-4" />
              <span>Modul Khusus Superadmin</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#173e32]">
              Manajemen Akun & Hak Akses Petugas
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#557267] leading-relaxed">
              Pendaftaran akun sistem Mawas bersifat tertutup untuk instansi berwenang. Superadmin mendaftarkan akun operator dan menetapkan password dummy awal. Operator dapat masuk dengan password tersebut atau via Google OAuth dengan email yang didaftarkan.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173e32] px-4 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]"
          >
            <UserPlus className="size-4 text-[#34d399]" />
            <span>Daftarkan Akun Baru</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#173e32]/10 pt-4 text-xs">
          <div className="rounded-lg bg-[#fbfaf6] p-3 border border-[#173e32]/10">
            <span className="text-[#557267]">Total Operator:</span>
            <p className="font-mono text-xl font-bold text-[#173e32]">{isLoading ? "…" : users.length}</p>
          </div>
          <div className="rounded-lg bg-[#fbfaf6] p-3 border border-[#173e32]/10">
            <span className="text-[#557267]">Operator Lapangan:</span>
            <p className="font-mono text-xl font-bold text-[#10b981]">
              {isLoading ? "…" : users.filter((u) => u.role === "operator").length}
            </p>
          </div>
          <div className="rounded-lg bg-[#fbfaf6] p-3 border border-[#173e32]/10">
            <span className="text-[#557267]">Akun Aktif:</span>
            <p className="font-mono text-xl font-bold text-[#166534]">
              {isLoading ? "…" : users.filter((u) => u.status === "aktif").length}
            </p>
          </div>
          <div className="rounded-lg bg-[#fbfaf6] p-3 border border-[#173e32]/10">
            <span className="text-[#557267]">Akun Nonaktif:</span>
            <p className="font-mono text-xl font-bold text-[#166534]">
              {isLoading ? "…" : users.filter((u) => u.status === "nonaktif").length}
            </p>
          </div>
        </div>
      </section>
      {loadError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#991b1b]/20 bg-[#fee2e2] p-3 text-xs text-[#991b1b]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}
      {errorMsg && !modalOpen && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#991b1b]/20 bg-[#fee2e2] p-3 text-xs text-[#991b1b]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {/* Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#173e32]/12 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau email petugas..."
            className="min-h-11 w-full rounded-lg border border-[#173e32]/15 bg-[#fbfaf6] py-2 pl-9 pr-3 text-xs sm:text-sm text-[#173e32] placeholder:text-[#557267] focus-visible:outline-2 focus-visible:outline-[#10b981]"
          />
        </label>

      </div>

      {/* Users Table */}
      <section className="overflow-hidden rounded-xl border border-[#173e32]/12 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#173e32] text-[#f5f1e8]">
              <tr>
                <th className="p-3.5 font-bold">Nama Petugas & Email</th>
                <th className="p-3.5 font-bold">Peran Akses</th>
                <th className="p-3.5 font-bold">Status Akun</th>
                <th className="p-3.5 font-bold">Password Sementara / Dummy</th>
                <th className="p-3.5 font-bold">Tgl Daftar</th>
                <th className="p-3.5 font-bold text-right">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#173e32]/10 bg-white">
              {isLoading && filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-[#557267]">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-[#10b981]" />
                      Memuat akun operator…
                    </span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-[#557267]">
                    Tidak ada akun yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        u.status === "nonaktif"
                          ? "bg-gray-100/80 opacity-55 grayscale"
                          : "hover:bg-[#fbfaf6]"
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#173e32]/10 font-bold text-[#173e32]">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={`Foto profil ${u.name}`}
                                className="size-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              u.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#173e32] text-xs sm:text-sm">{u.name}</p>
                            <p className="font-mono text-[11px] text-[#557267]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                          "bg-[#10b981]/15 text-[#065f46] border-[#10b981]/30"
                        }`}>
                          <UserCheck className="size-3" />
                          <span>{roleLabel}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u.id)}
                          disabled={Boolean(pendingActions[u.id])}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                            u.status === "aktif"
                              ? "bg-[#166534]/10 text-[#166534] hover:bg-[#166534]/20"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                          title="Klik untuk mengubah status"
                        >
                          {pendingActions[u.id] === "status"
                            ? <Loader2 className="size-3 animate-spin" />
                            : <span className={`size-1.5 rounded-full ${u.status === "aktif" ? "bg-[#166534]" : "bg-gray-500"}`} />}
                          <span className="capitalize">{pendingActions[u.id] === "status" ? "Menyimpan…" : u.status}</span>
                        </button>
                      </td>

                      <td className="p-3.5">
                        {u.temporaryPassword ? (
                          <div className="inline-flex items-center gap-1.5 rounded-md border border-[#173e32]/15 bg-[#fbfaf6] px-2 py-1 font-mono text-[11px] text-[#173e32]">
                            <Lock className="size-3 text-[#557267]" />
                            <span>{u.temporaryPassword}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(u.temporaryPassword!, u.id)}
                              className="ml-1 text-[#557267] hover:text-[#173e32]"
                              title="Salin password dummy"
                            >
                              {copiedId === u.id ? <Check className="size-3 text-[#166534]" /> : <Copy className="size-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#557267] italic">Telah diatur mandiri / OAuth Google</span>
                        )}
                      </td>

                      <td className="p-3.5 text-[11px] text-[#557267]">
                        {new Date(u.registeredAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u.id)}
                            disabled={Boolean(pendingActions[u.id])}
                            className="grid size-8 place-items-center rounded-lg border border-[#173e32]/15 text-[#557267] hover:text-[#173e32] hover:bg-[#dce7d7] transition-colors disabled:cursor-wait disabled:opacity-60"
                            title={pendingActions[u.id] === "password" ? "Menyimpan password baru…" : "Generate ulang password dummy"}
                          >
                            {pendingActions[u.id] === "password"
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <RefreshCw className="size-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteId(u.id)}
                            className="grid size-8 place-items-center rounded-lg border border-[#991b1b]/20 text-[#991b1b] hover:bg-[#991b1b]/10 transition-colors"
                            title="Cabut akses operator"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Daftarkan Akun Baru */}
      {modalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#091b15]/65 p-4 backdrop-blur-xs"
            role="presentation"
            onMouseDown={() => setModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="register-dialog-title"
              className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#173e32]/20 bg-[#fbfaf6] shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#173e32]/10 bg-white px-5 py-4">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 text-[#10b981]" />
                <h3 id="register-dialog-title" className="font-serif text-lg font-bold text-[#173e32]">
                  Daftarkan Akun Petugas Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid size-10 place-items-center rounded-lg text-[#36564a] hover:bg-[#dce7d7]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Jika akun baru saja berhasil didaftarkan: tampilkan summary copy */}
            {createdSummary ? (
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-[#166534]/30 bg-[#dcfce7] p-4 text-xs text-[#14532d]">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="size-5 text-[#166534]" />
                    <span>Akun Berhasil Didaftarkan ke Sistem Mawas!</span>
                  </div>
                  <p className="mt-1 leading-relaxed">
                    Berikan kredensial berikut kepada petugas/operator yang bersangkutan:
                  </p>
                </div>

                <div className="rounded-xl border border-[#173e32]/15 bg-white p-4 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[#557267]">Nama:</span>
                    <p className="font-bold text-[#173e32]">{createdSummary.name}</p>
                  </div>
                  <div>
                    <span className="text-[#557267]">Email:</span>
                    <p className="font-bold font-mono text-[#173e32]">{createdSummary.email}</p>
                  </div>
                  <div>
                    <span className="text-[#557267]">Peran Akses:</span>
                    <p className="font-bold text-[#10b981]">{roleLabel}</p>
                  </div>
                  <div className="border-t border-[#173e32]/10 pt-2">
                    <span className="text-[#557267]">Password Sementara (Dummy):</span>
                    <div className="mt-1 flex items-center justify-between rounded-lg bg-[#f5f1e8] p-2 font-mono font-bold text-[#173e32]">
                      <span>{createdSummary.temporaryPassword}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(createdSummary.temporaryPassword!, "summary")}
                        className="inline-flex items-center gap-1 text-xs text-[#173e32] hover:text-[#10b981]"
                      >
                        {copiedId === "summary" ? <Check className="size-3.5 text-[#166534]" /> : <Copy className="size-3.5" />}
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#f5f1e8] p-3 text-[11px] text-[#557267] leading-relaxed">
                  <strong>Pilihan Cara Masuk Operator:</strong>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    <li>Dapat langsung login di halaman Masuk dengan email & password dummy di atas.</li>
                    <li>Atau langsung klik tombol <strong>"Masuk dengan Google"</strong> menggunakan email tersebut.</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="min-h-11 rounded-lg bg-[#173e32] px-5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542]"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              /* Form Input Pendaftaran */
              <form onSubmit={handleSubmitNewUser} className="p-5 sm:p-6 space-y-4">
                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#991b1b]/20 bg-[#fee2e2] p-3 text-xs text-[#991b1b]">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="user-name" className="text-xs font-bold text-[#173e32]">
                    Nama Tampilan Petugas (opsional)
                  </label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
                    <input
                      id="user-name"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Kosongkan untuk nama default Operator N"
                      className="min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white pl-9 pr-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="user-email" className="text-xs font-bold text-[#173e32]">
                    Email Petugas (Gmail atau Email Dinas) *
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
                    <input
                      id="user-email"
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="budi.santoso@pertanian.go.id atau budi@gmail.com"
                      className="min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white pl-9 pr-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#557267]">
                    Jika operator ingin login menggunakan akun Google, pastikan email ini cocok dengan akun Google mereka.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="user-pw" className="text-xs font-bold text-[#173e32]">
                      Password Sementara (Dummy) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormPassword(generateDummyPassword())}
                      className="text-[11px] font-semibold text-[#10b981] hover:underline"
                    >
                      Acak Ulang
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
                    <input
                      id="user-pw"
                      type="text"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white pl-9 pr-3 font-mono text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-[#173e32]/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="min-h-11 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-11 rounded-lg bg-[#173e32] px-5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors"
                  >
                    {isSubmitting ? "Mendaftarkan..." : "Daftarkan Akun Sekarang"}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Permanent User Deletion Confirmation */}
      {deleteId && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#091b15]/65 p-4 backdrop-blur-xs"
            role="presentation"
            onMouseDown={() => !isDeleting && setDeleteId(null)}
          >
            <div
              role="alertdialog"
              className="w-full max-w-md rounded-xl border border-[#991b1b]/20 bg-white p-5 shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h4 className="font-serif text-lg font-bold text-[#991b1b]">Hapus Akun Operator Permanen?</h4>
              <p className="mt-2 text-xs sm:text-sm text-[#557267] leading-relaxed">
                Akun ini akan dihapus dari Supabase Auth dan tidak dapat dipulihkan. Riwayat verifikasinya tetap disimpan, tetapi tautan ke akun ini akan dilepas. Email dapat didaftarkan kembali setelah penghapusan.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="min-h-10 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  disabled={isDeleting}
                  className="min-h-10 rounded-lg bg-[#991b1b] px-4 text-xs font-bold text-white hover:bg-[#7f1d1d] disabled:opacity-60"
                >
                  {isDeleting ? "Menghapus Akun..." : "Hapus Permanen"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

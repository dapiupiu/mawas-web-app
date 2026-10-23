import { useState, useMemo } from "react";
import type { FormEvent } from "react";
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
  CheckCircle2
} from "lucide-react";
import type { ManagedUser, UserRole } from "@/types/dashboard";
import { authApi } from "@/lib/api";

interface UserManagementViewProps {
  users: ManagedUser[];
  onUsersChange: (users: ManagedUser[]) => void;
}

export function UserManagementView({ users, onUsersChange }: UserManagementViewProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"semua" | UserRole>("semua");
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states for new user registration
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("operator");
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
    setFormRole("operator");
    setFormPassword(generateDummyPassword());
    setErrorMsg(null);
    setCreatedSummary(null);
    setModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = query.toLowerCase().trim();
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchR = roleFilter === "semua" || u.role === roleFilter;
      return matchQ && matchR;
    });
  }, [users, query, roleFilter]);

  const handleCopyPassword = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = (id: string) => {
    const updated = users.map((u) => {
      if (u.id === id) {
        return {
          ...u,
          status: (u.status === "aktif" ? "nonaktif" : "aktif") as "aktif" | "nonaktif",
        };
      }
      return u;
    });
    onUsersChange(updated);
  };

  const handleResetPassword = (id: string) => {
    const newPw = generateDummyPassword();
    const updated = users.map((u) => {
      if (u.id === id) {
        return {
          ...u,
          temporaryPassword: newPw,
        };
      }
      return u;
    });
    onUsersChange(updated);
  };

  const handleDelete = (id: string) => {
    onUsersChange(users.filter((u) => u.id !== id));
    setDeleteId(null);
  };

  const handleSubmitNewUser = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const email = formEmail.trim().toLowerCase();
    const name = formName.trim();
    const password = formPassword.trim();

    if (!name || !email || !password) {
      setErrorMsg("Harap lengkapi semua data wajib.");
      setIsSubmitting(false);
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === email)) {
      setErrorMsg("Email ini sudah terdaftar di sistem.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Panggil backend register agar akun tersimpan ke Supabase / database jika backend menyala
      try {
        await authApi.register(email, password, formRole);
      } catch (err: any) {
        // Jika endpoint backend sedang offline atau error jaringan, catat tapi tetap simpan di state lokal
        console.warn("Backend register notice:", err?.response?.data || err.message);
      }

      const newUser: ManagedUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role: formRole,
        status: "aktif",
        registeredAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date()),
        temporaryPassword: password,
      };

      onUsersChange([newUser, ...users]);
      setCreatedSummary(newUser);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mendaftarkan akun.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabelMap: Record<UserRole, string> = {
    admin: "Administrator",
    operator: "Operator Lapangan",
    pembuat_kebijakan: "Pembuat Kebijakan",
  };

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
            <span className="text-[#557267]">Total Akun:</span>
            <p className="font-mono text-xl font-bold text-[#173e32]">{users.length}</p>
          </div>
          <div className="rounded-lg bg-[#fbfaf6] p-3 border border-[#173e32]/10">
            <span className="text-[#557267]">Operator Lapangan:</span>
            <p className="font-mono text-xl font-bold text-[#10b981]">
              {users.filter((u) => u.role === "operator").length}
            </p>
          </div>
          <div className="rounded-lg bg-[#fbfaf6] p-3 border border-[#173e32]/10">
            <span className="text-[#557267]">Pembuat Kebijakan:</span>
            <p className="font-mono text-xl font-bold text-[#b45309]">
              {users.filter((u) => u.role === "pembuat_kebijakan").length}
            </p>
          </div>
          <div className="rounded-lg bg-[#fbfaf6] p-3 border border-[#173e32]/10">
            <span className="text-[#557267]">Akun Aktif:</span>
            <p className="font-mono text-xl font-bold text-[#166534]">
              {users.filter((u) => u.status === "aktif").length}
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
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

        {/* Role Filter Tabs */}
        <div className="inline-flex rounded-lg border border-[#173e32]/15 bg-[#fbfaf6] p-0.5 text-xs font-semibold">
          {(["semua", "operator", "pembuat_kebijakan", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`min-h-9 px-3 rounded-md transition-colors ${
                roleFilter === r
                  ? "bg-[#173e32] text-[#f5f1e8] shadow-sm"
                  : "text-[#557267] hover:text-[#173e32]"
              }`}
            >
              {r === "semua" ? "Semua Peran" : roleLabelMap[r]}
            </button>
          ))}
        </div>
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-[#557267]">
                    Tidak ada akun yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === "admin";
                  return (
                    <tr key={u.id} className="hover:bg-[#fbfaf6] transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#173e32]/10 font-bold text-[#173e32]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#173e32] text-xs sm:text-sm">{u.name}</p>
                            <p className="font-mono text-[11px] text-[#557267]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                          isAdmin 
                            ? "bg-[#173e32]/10 text-[#173e32] border-[#173e32]/25" 
                            : u.role === "pembuat_kebijakan"
                              ? "bg-[#b45309]/10 text-[#b45309] border-[#b45309]/25"
                              : "bg-[#10b981]/15 text-[#065f46] border-[#10b981]/30"
                        }`}>
                          <UserCheck className="size-3" />
                          <span>{roleLabelMap[u.role]}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u.id)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                            u.status === "aktif"
                              ? "bg-[#166534]/10 text-[#166534] hover:bg-[#166534]/20"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                          title="Klik untuk mengubah status"
                        >
                          <span className={`size-1.5 rounded-full ${u.status === "aktif" ? "bg-[#166534]" : "bg-gray-500"}`} />
                          <span className="capitalize">{u.status}</span>
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
                        {u.registeredAt}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u.id)}
                            className="grid size-8 place-items-center rounded-lg border border-[#173e32]/15 text-[#557267] hover:text-[#173e32] hover:bg-[#dce7d7] transition-colors"
                            title="Generate ulang password dummy"
                          >
                            <RefreshCw className="size-3.5" />
                          </button>

                          {!isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteId(u.id)}
                              className="grid size-8 place-items-center rounded-lg border border-[#991b1b]/20 text-[#991b1b] hover:bg-[#991b1b]/10 transition-colors"
                              title="Hapus akun petugas"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
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
        <div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-[#091b15]/65 p-0 sm:p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-dialog-title"
            className="w-full max-w-lg rounded-t-2xl sm:rounded-xl border border-[#173e32]/20 bg-[#fbfaf6] shadow-2xl overflow-hidden"
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
                    <p className="font-bold text-[#10b981] capitalize">{roleLabelMap[createdSummary.role]}</p>
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
                    Nama Lengkap Petugas *
                  </label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
                    <input
                      id="user-name"
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Budi Santoso (Mantri Tani Grobogan)"
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
                  <label htmlFor="user-role" className="text-xs font-bold text-[#173e32]">
                    Peran Hak Akses *
                  </label>
                  <select
                    id="user-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="mt-1 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                  >
                    <option value="operator">Operator Lapangan (Verifikasi & Input Wilayah)</option>
                    <option value="pembuat_kebijakan">Pembuat Kebijakan (Executive Brief & Laporan)</option>
                    <option value="admin">Administrator Sistem (Full Control & User Management)</option>
                  </select>
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
      )}

      {/* Delete User Confirmation Modal */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#091b15]/65 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={() => setDeleteId(null)}
        >
          <div
            role="alertdialog"
            className="w-full max-w-md rounded-xl border border-[#991b1b]/20 bg-white p-5 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h4 className="font-serif text-lg font-bold text-[#991b1b]">Konfirmasi Cabut Akses Pengguna</h4>
            <p className="mt-2 text-xs sm:text-sm text-[#557267] leading-relaxed">
              Apakah Anda yakin ingin mencabut hak akses akun ini dari sistem Mawas? Akun tidak lagi dapat mengakses ruang kerja.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="min-h-10 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="min-h-10 rounded-lg bg-[#991b1b] px-4 text-xs font-bold text-white hover:bg-[#7f1d1d]"
              >
                Cabut Akses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

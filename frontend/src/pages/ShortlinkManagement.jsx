import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { Link2, Copy as CopyIcon, Trash2, Settings } from "lucide-react";

function ShortlinkManagement() {
  const { token, onUnauthorized } = useOutletContext();
  const [links, setLinks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [originalUrl, setOriginalUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [showFormatSettings, setShowFormatSettings] = useState(false);
  const [urlFormat, setUrlFormat] = useState(() => localStorage.getItem("urlFormat") || "standard");
  const [customExtension, setCustomExtension] = useState(() => localStorage.getItem("customExtension") || ".mp4");

  const handleSetUrlFormat = (format) => {
    setUrlFormat(format);
    localStorage.setItem("urlFormat", format);
  };

  const getCleanedExtension = (ext) => {
    if (!ext) return "";
    return ext.startsWith(".") ? ext : "." + ext;
  };

  const fetchLinks = async (pageNumber) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/links?page=${pageNumber}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil data");
      }
      setLinks(data.data);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchLinks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalUrl,
          extension: urlFormat === "custom" ? getCleanedExtension(customExtension) : ""
        }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal membuat shortlink");
      }
      setOriginalUrl("");
      fetchLinks(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus shortlink ini?")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/links/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus");
      }
      fetchLinks(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (link, next) => {
    try {
      const res = await fetch(`${API_BASE_URL}/links/${link.id}/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: next,
        }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengubah status");
      }
      setLinks((prev) =>
        prev.map((item) =>
          item.id === link.id ? { ...item, is_active: next ? 1 : 0 } : item,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <Link2 className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-800">
              Buat Shortlink
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowFormatSettings(!showFormatSettings)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Pemformatan URL"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
        </div>

        {showFormatSettings && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Settings className="h-4 w-4 text-sky-600" />
              <span>Pemformatan URL</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih apakah akan secara otomatis menambahkan ekstensi khusus (misalnya .mp4) ke tautan pendek standar yang Anda hasilkan.
            </p>
            
            <div className="grid gap-2 sm:grid-cols-2">
              <div
                onClick={() => handleSetUrlFormat("standard")}
                className={`cursor-pointer rounded-xl border p-3.5 transition flex flex-col justify-between ${
                  urlFormat === "standard"
                    ? "border-sky-500 bg-sky-50/70 text-sky-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Tautan Standar</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 uppercase">
                    Bawaan
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-mono text-slate-500">
                  {window.location.host}/s/abcd1234
                </p>
              </div>

              <div
                onClick={() => handleSetUrlFormat("custom")}
                className={`cursor-pointer rounded-xl border p-3.5 transition flex flex-col justify-between ${
                  urlFormat === "custom"
                    ? "border-sky-500 bg-sky-50/70 text-sky-955"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-semibold block">Ekstensi Kustom</span>
                
                <input
                  type="text"
                  placeholder=".mp4"
                  value={customExtension}
                  onChange={(e) => {
                    setCustomExtension(e.target.value);
                    localStorage.setItem("customExtension", e.target.value);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
                  onClick={(e) => e.stopPropagation()}
                />

                <p className="mt-2 text-[11px] font-mono text-slate-500 truncate">
                  {window.location.host}/s/abcd1234{getCleanedExtension(customExtension)}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              Catatan: Pengaturan ini hanya berlaku untuk tautan yang baru dibuat.
            </p>
          </div>
        )}
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="url"
            placeholder="https://contoh.com/halaman-panjang..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {creating ? "Menyimpan..." : "Generate"}
          </button>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Daftar Shortlink
          </h2>
          <p className="text-xs text-slate-500">
            Halaman {page} dari {totalPages}
          </p>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-3 py-2 whitespace-nowrap">Kode</th>
                <th className="px-3 py-2">URL Asli</th>
                <th className="px-3 py-2 whitespace-nowrap">Short URL</th>
                <th className="px-3 py-2 whitespace-nowrap">Status</th>
                <th className="px-3 py-2 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-slate-500"
                    colSpan={5}
                  >
                    Belum ada data.
                  </td>
                </tr>
              )}
              {links.map((link) => (
                <tr key={link.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {link.code}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <div className="max-w-[200px] sm:max-w-xs truncate">
                      <a
                        href={link.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs sm:text-sm text-sky-600 hover:underline"
                        title={link.original_url}
                      >
                        {link.original_url}
                      </a>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                    {window.location.origin}/s/{link.code}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <span className="text-xs text-slate-600">
                        {link.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={!!link.is_active}
                        onChange={(e) =>
                          handleToggleActive(link, e.target.checked)
                        }
                      />
                      <span className="relative h-4 w-7 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500">
                        <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow transition peer-checked:translate-x-3" />
                      </span>
                    </label>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={async () => {
                          const value = `${window.location.origin}/s/${link.code}`;
                          try {
                            if (navigator.clipboard?.writeText) {
                              await navigator.clipboard.writeText(value);
                            } else {
                              const textarea =
                                document.createElement("textarea");
                              textarea.value = value;
                              document.body.appendChild(textarea);
                              textarea.select();
                              document.execCommand("copy");
                              document.body.removeChild(textarea);
                            }
                            alert("Berhasil menyalin shortlink.");
                          } catch {
                            alert("Gagal menyalin shortlink.");
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-100"
                      >
                        <CopyIcon className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4 pt-3 flex flex-col items-center justify-between gap-3 sm:flex-row border-t">
          <button
            className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => fetchLinks(page - 1)}
            disabled={page <= 1}
          >
            ‹ Sebelumnya
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Halaman</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
              {page}
            </span>
            <span>dari</span>
            <span>{totalPages}</span>
          </div>
          <button
            className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => fetchLinks(page + 1)}
            disabled={page >= totalPages}
          >
            Selanjutnya ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShortlinkManagement;

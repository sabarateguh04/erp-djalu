import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { financeKategoriApi, cabangApi } from "../api/client.js";

const baseEmptyForm = { tanggal: "", nama: "", tipe: "", status: "", nilai: "", catatan: "" };

function extraDefaultsFromRecord(fields, record) {
  const out = {};
  for (const f of fields) {
    const raw = record?.[f.key];
    if (f.type === "list") {
      out[f.key] = Array.isArray(raw) ? raw.join(", ") : "";
    } else {
      out[f.key] = raw ?? "";
    }
  }
  return out;
}

export default function CrudModal({ config, initial, onClose, onSubmit, saving }) {
  const extraFields = config.extraFields || [];
  const [form, setForm] = useState({ ...baseEmptyForm, ...extraDefaultsFromRecord(extraFields, null) });
  const [error, setError] = useState("");
  const [financeKategoriOptions, setFinanceKategoriOptions] = useState([]);
  const [cabangOptions, setCabangOptions] = useState([]);

  const needsFinanceKategori = extraFields.some((f) => f.type === "finance-kategori");
  const needsCabang = extraFields.some((f) => f.type === "cabang");

  useEffect(() => {
    if (!needsFinanceKategori) return;
    financeKategoriApi
      .list()
      .then(setFinanceKategoriOptions)
      .catch(() => setFinanceKategoriOptions([]));
  }, [needsFinanceKategori]);

  useEffect(() => {
    if (!needsCabang) return;
    cabangApi
      .list()
      .then(setCabangOptions)
      .catch(() => setCabangOptions([]));
  }, [needsCabang]);

  useEffect(() => {
    if (initial) {
      setForm({
        tanggal: initial.tanggal || "",
        nama: initial.nama || "",
        tipe: initial.tipe || config.tipeOptions[0],
        status: initial.status || config.statusOptions[0],
        nilai: initial.nilai ?? "",
        catatan: initial.catatan || "",
        ...extraDefaultsFromRecord(extraFields, initial),
      });
    } else {
      setForm({
        tanggal: new Date().toISOString().slice(0, 10),
        nama: "",
        tipe: config.tipeOptions[0],
        status: config.statusOptions[0],
        nilai: "",
        catatan: "",
        ...extraDefaultsFromRecord(extraFields, null),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, config]);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError(`${config.namaLabel} wajib diisi`);
      return;
    }
    if (!form.tanggal) {
      setError("Tanggal wajib diisi");
      return;
    }
    setError("");

    const payload = { ...form };
    for (const f of extraFields) {
      if (f.type === "list") {
        payload[f.key] = form[f.key]
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }
    }
    onSubmit(payload);
  };

  const renderExtraField = (f) => {
    if (f.type === "finance-kategori") {
      return (
        <select
          value={form[f.key]}
          onChange={handleChange(f.key)}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
        >
          <option value="">- Pilih kategori -</option>
          {financeKategoriOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.nama} ({opt.kelompok})
            </option>
          ))}
        </select>
      );
    }
    if (f.type === "cabang") {
      return (
        <select
          value={form[f.key]}
          onChange={handleChange(f.key)}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
        >
          <option value="">- Pilih cabang -</option>
          {cabangOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.nama}
            </option>
          ))}
        </select>
      );
    }
    if (f.type === "select") {
      return (
        <select
          value={form[f.key]}
          onChange={handleChange(f.key)}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
        >
          <option value="">- Pilih -</option>
          {f.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
        value={form[f.key]}
        onChange={handleChange(f.key)}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">
            {initial ? `Edit ${config.singular}` : `Tambah ${config.singular}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Tanggal</label>
            <input
              type="date"
              value={form.tanggal}
              onChange={handleChange("tanggal")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">{config.namaLabel}</label>
            <input
              type="text"
              value={form.nama}
              onChange={handleChange("nama")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              placeholder={config.namaLabel}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">{config.tipeLabel}</label>
              <select
                value={form.tipe}
                onChange={handleChange("tipe")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                {config.tipeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                value={form.status}
                onChange={handleChange("status")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                {config.statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {config.showNilai && (
            <div>
              <label className="text-xs font-medium text-gray-500">{config.nilaiLabel}</label>
              <input
                type="number"
                value={form.nilai}
                onChange={handleChange("nilai")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                placeholder="0"
              />
            </div>
          )}

          {extraFields.length > 0 && (
            <>
              <hr className="border-gray-100" />
              {extraFields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-500">{f.label}</label>
                  {renderExtraField(f)}
                </div>
              ))}
            </>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500">Catatan</label>
            <textarea
              value={form.catatan}
              onChange={handleChange("catatan")}
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 resize-none"
              placeholder="Opsional"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

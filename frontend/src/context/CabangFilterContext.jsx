import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cabangApi } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const STORAGE_KEY = "erp_djalu_selected_cabang";
const CabangFilterContext = createContext(null);

// Modul 15 (Multi-cabang): dropdown "Semua Cabang / pilih satu cabang" yang
// bisa dipakai lintas halaman (Dashboard, Management, Inventory) untuk
// menyaring data berdasarkan cabangId. Data lama yang belum diberi cabangId
// hanya muncul saat "Semua Cabang" dipilih — bukan bug, memang belum diisi.
export function CabangFilterProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cabangList, setCabangList] = useState([]);
  const [selectedCabangId, setSelectedCabangIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || "");

  useEffect(() => {
    if (!isAuthenticated) {
      setCabangList([]);
      return;
    }
    cabangApi
      .list()
      .then(setCabangList)
      .catch(() => setCabangList([]));
  }, [isAuthenticated]);

  const setSelectedCabangId = (id) => {
    setSelectedCabangIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const filterByCabang = (records) => {
    if (!selectedCabangId) return records;
    return records.filter((r) => r.cabangId === selectedCabangId);
  };

  const value = useMemo(
    () => ({ cabangList, selectedCabangId, setSelectedCabangId, filterByCabang }),
    [cabangList, selectedCabangId]
  );

  return <CabangFilterContext.Provider value={value}>{children}</CabangFilterContext.Provider>;
}

export function useCabangFilter() {
  const ctx = useContext(CabangFilterContext);
  if (!ctx) throw new Error("useCabangFilter harus dipakai di dalam CabangFilterProvider");
  return ctx;
}

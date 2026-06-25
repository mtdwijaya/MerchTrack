"use client";

import { useCallback, useEffect, useState } from "react";

import { showError } from "@/lib/toast";

export function useFormModal<T>(loadById?: (id: number) => Promise<T | null>) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => {
    setEditId(null);
    setEditData(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((id: number) => {
    setEditId(id);
    setEditData(null);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open || editId === null || !loadById) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadById(editId)
      .then((data) => {
        if (cancelled) return;
        if (!data) throw new Error("Data tidak ditemukan");
        setEditData(data);
      })
      .catch((error) => {
        if (cancelled) return;
        showError(
          error instanceof Error ? error.message : "Gagal memuat data"
        );
        setOpen(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, editId, loadById]);

  return {
    open,
    setOpen,
    editId,
    editData,
    loading,
    saving,
    setSaving,
    openAdd,
    openEdit,
    close,
    isEdit: editId !== null,
  };
}

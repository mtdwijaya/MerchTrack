"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";

export function useListFilters(defaults?: {
  sort?: string;
  page?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search);

  const page = Number(searchParams.get("page") || defaults?.page || "1");
  const sort = searchParams.get("sort") || defaults?.sort || "";

  const replaceParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    replaceParams({ search: debouncedSearch || null, page: "1" });
  }, [debouncedSearch, replaceParams, urlSearch]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const updates: Record<string, string | null> = { [key]: value || null };
      if (key !== "page") updates.page = "1";
      replaceParams(updates);
    },
    [replaceParams]
  );

  const setPage = useCallback(
    (nextPage: number) => replaceParams({ page: String(nextPage) }),
    [replaceParams]
  );

  const resetParams = useCallback(
    (keys: string[]) => {
      const updates: Record<string, string | null> = Object.fromEntries(
        keys.map((key) => [key, null])
      );
      updates.page = "1";
      replaceParams(updates);
      setSearch("");
    },
    [replaceParams]
  );

  const getParam = useCallback(
    (key: string, fallback = "") => searchParams.get(key) ?? fallback,
    [searchParams]
  );

  return {
    search,
    setSearch,
    page,
    sort,
    setParam,
    setPage,
    resetParams,
    getParam,
    replaceParams,
  };
}

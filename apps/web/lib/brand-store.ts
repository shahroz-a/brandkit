"use client";

import { DEFAULT_BRAND_TOKENS, normalizeBrandTokens } from "@brandkit/core";
import type { BrandTokens } from "@brandkit/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BrandState {
  tokens: BrandTokens;
  favorites: string[];
  recentExports: string[];
  setTokens: (input: Partial<BrandTokens>) => void;
  applyTokens: (tokens: Partial<BrandTokens>) => void;
  toggleFavorite: (assetId: string) => void;
  recordExport: (label: string) => void;
  reset: () => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      tokens: DEFAULT_BRAND_TOKENS,
      favorites: [],
      recentExports: [],
      setTokens: (input) => set((state) => ({ tokens: normalizeBrandTokens({ ...state.tokens, ...input }) })),
      applyTokens: (tokens) => set({ tokens: normalizeBrandTokens(tokens) }),
      toggleFavorite: (assetId) =>
        set((state) => ({
          favorites: state.favorites.includes(assetId)
            ? state.favorites.filter((id) => id !== assetId)
            : [...state.favorites, assetId]
        })),
      recordExport: (label) =>
        set((state) => ({
          recentExports: [label, ...state.recentExports.filter((item) => item !== label)].slice(0, 6)
        })),
      reset: () => set({ tokens: DEFAULT_BRAND_TOKENS, favorites: [], recentExports: [] })
    }),
    {
      name: "brandkit-os"
    }
  )
);

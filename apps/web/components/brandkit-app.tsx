"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import {
  Archive,
  BadgeCheck,
  Bot,
  Braces,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy as CopyIcon,
  Download,
  FileJson,
  FolderSync,
  Globe2,
  Heart,
  ImageDown,
  ImagePlus,
  Layers3,
  LayoutGrid,
  Loader2,
  Moon,
  Palette,
  RefreshCw,
  SearchCheck,
  Server,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Upload,
  Wand2,
  XCircle,
} from "lucide-react";
import {
  generateBrandAssets,
  LOGO_SHAPES,
  LOGO_STYLES,
  MAX_LOGO_DATA_URI_LENGTH,
  META_GRADIENTS,
  META_LAYOUTS,
  META_PATTERNS,
  normalizeBrandTokens,
  parseBatchInput,
  renderLogoSvg,
  THEMES,
  validateBrandTokens,
} from "@brandkit/core";
import type {
  AssetCategory,
  BrandAsset,
  BrandMode,
  BrandTheme,
  BrandTokens,
  LogoShape,
  LogoSource,
  LogoStyle,
  MetaGradient,
  MetaLayout,
  MetaPattern,
} from "@brandkit/core";
import { presets } from "@brandkit/presets";
import { includedTemplates } from "@brandkit/templates";
import { Button } from "@/components/ui/button";
import { useBrandStore } from "@/lib/brand-store";
import { downloadBlob, downloadText, downloadZip } from "@/lib/download";
import { brandInputSchema } from "@/lib/schema";
import { cn, svgToDataUri } from "@/lib/utils";

type Section = "editor" | "assets" | "batch" | "validate" | "usecases";
type CategoryFilter = AssetCategory | "all" | "favorites";

const sections: Array<{
  id: Section;
  label: string;
  icon: typeof SlidersHorizontal;
}> = [
  { id: "editor", label: "Editor", icon: SlidersHorizontal },
  { id: "assets", label: "Assets", icon: LayoutGrid },
  { id: "batch", label: "Batch", icon: FolderSync },
  { id: "validate", label: "Doctor", icon: SearchCheck },
  { id: "usecases", label: "Use cases", icon: Globe2 },
];

const categoryFilters: Array<{ id: CategoryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "brand", label: "Brand" },
  { id: "social", label: "Social" },
  { id: "logo", label: "Logo" },
  { id: "favicon", label: "Icons" },
  { id: "manifest", label: "Manifest" },
  { id: "metadata", label: "Metadata" },
];

export function BrandKitApp() {
  const brandInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [section, setSection] = useState<Section>("editor");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [batchText, setBatchText] = useState(
    "name,description,primary,secondary,accent\nLaunch Pad,Ship faster,#2563EB,#111827,#F97316",
  );
  const [busy, setBusy] = useState<"zip" | "png" | "batch" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokens = useBrandStore((state) => state.tokens);
  const favorites = useBrandStore((state) => state.favorites);
  const recentExports = useBrandStore((state) => state.recentExports);
  const setTokens = useBrandStore((state) => state.setTokens);
  const applyTokens = useBrandStore((state) => state.applyTokens);
  const reset = useBrandStore((state) => state.reset);
  const toggleFavorite = useBrandStore((state) => state.toggleFavorite);
  const recordExport = useBrandStore((state) => state.recordExport);

  const assets = useMemo(() => generateBrandAssets(tokens), [tokens]);
  const validation = useMemo(() => validateBrandTokens(tokens), [tokens]);
  const batch = useMemo(() => parseBatchInput(batchText), [batchText]);
  const featuredAsset =
    assets.find((asset) => asset.id === "og-image") ?? assets[0];
  const filteredAssets = assets.filter((asset) => {
    if (category === "all") {
      return true;
    }

    if (category === "favorites") {
      return favorites.includes(asset.id);
    }

    return asset.category === category;
  });

  function updateToken<K extends keyof BrandTokens>(
    field: K,
    value: BrandTokens[K],
  ) {
    setTokens({ [field]: value } as Partial<BrandTokens>);
  }

  function applyMode(mode: BrandMode) {
    setTokens({
      mode,
      background: mode === "dark" ? "#0B1020" : "#F8FAFC",
      foreground: mode === "dark" ? "#F8FAFC" : "#111827",
    });
  }

  async function handleLogoUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const allowed = new Set([
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml",
      ]);
      if (!allowed.has(file.type)) {
        setError("Upload a PNG, JPG, WebP, GIF, or SVG logo.");
        return;
      }

      if (file.size > 1_050_000) {
        setError(
          "Logo upload is too large. Use a file under 1 MB so exports stay portable.",
        );
        return;
      }

      const dataUri = await readFileAsDataUri(file);
      if (dataUri.length > MAX_LOGO_DATA_URI_LENGTH) {
        setError(
          "Logo data is too large for browser storage. Try a smaller SVG or optimized PNG.",
        );
        return;
      }

      setTokens({ logoSource: "uploaded", logoDataUri: dataUri });
      setNotice("Logo uploaded.");
    } catch {
      setError("Logo upload failed. Try a different image file.");
    } finally {
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  }

  function removeUploadedLogo() {
    const next: Partial<BrandTokens> = { ...tokens, logoSource: "generated" };
    delete next.logoDataUri;
    applyTokens(next);
    setNotice("Uploaded logo removed.");
  }

  async function handleZipExport() {
    try {
      setBusy("zip");
      await downloadZip(tokens, assets);
      recordExport("Full kit ZIP");
      setNotice("Export ready.");
    } catch {
      setError("Export failed. Try fewer assets or a different browser.");
    } finally {
      setBusy(null);
    }
  }

  async function handlePngExport() {
    if (!previewRef.current) {
      return;
    }

    try {
      setBusy("png");
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      downloadBlob("og-image.png", blob);
      recordExport("OpenGraph PNG");
      setNotice("PNG exported.");
    } catch {
      setError("PNG export failed. SVG export is still available.");
    } finally {
      setBusy(null);
    }
  }

  async function handleBatchExport() {
    try {
      setBusy("batch");
      const zip = new JSZip();
      batch.rows.forEach((row) => {
        const kit = normalizeBrandTokens(row);
        generateBrandAssets(kit).forEach((asset) => {
          zip.file(
            `${kit.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}/${asset.filename}`,
            asset.content,
          );
        });
      });
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
      });
      downloadBlob("brandkit-batch.zip", blob);
      recordExport("Batch ZIP");
      setNotice(`Batch exported: ${batch.rows.length} kits.`);
    } catch {
      setError("Batch export failed. Check the input format and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function copyTokens() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
      setNotice("Tokens copied.");
    } catch {
      setError("Clipboard denied. Export brand.json instead.");
    }
  }

  async function copySnippet(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied.`);
    } catch {
      setError("Clipboard denied. Select the snippet and copy it manually.");
    }
  }

  async function importBrand(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const json = JSON.parse(await file.text()) as unknown;
      const parsed = brandInputSchema.partial().safeParse(json);
      if (!parsed.success) {
        setError("Invalid brand JSON.");
        return;
      }

      const imported = Object.fromEntries(
        Object.entries(parsed.data).filter(([, value]) => value !== undefined),
      ) as Partial<BrandTokens>;
      applyTokens(imported);
      setNotice("Brand imported.");
    } catch {
      setError("Invalid JSON file.");
    } finally {
      if (brandInputRef.current) {
        brandInputRef.current.value = "";
      }
    }
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-white">
              <Wand2 size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-ink">
                BrandKit OS
              </h1>
              <p className="truncate text-xs text-[#64748B]">{tokens.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => brandInputRef.current?.click()}
              title="Import brand JSON"
            >
              <Upload size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button
              variant="ghost"
              onClick={copyTokens}
              title="Copy brand tokens"
            >
              <Clipboard size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              variant="secondary"
              onClick={handlePngExport}
              disabled={busy !== null}
              title="Export PNG"
            >
              {busy === "png" ? (
                <Loader2
                  className="animate-spin"
                  size={17}
                  aria-hidden="true"
                />
              ) : (
                <ImageDown size={17} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">PNG</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleZipExport}
              disabled={busy !== null}
              title="Export ZIP"
            >
              {busy === "zip" ? (
                <Loader2
                  className="animate-spin"
                  size={17}
                  aria-hidden="true"
                />
              ) : (
                <Archive size={17} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Export</span>
            </Button>
            <input
              ref={brandInputRef}
              className="hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void importBrand(event.target.files?.[0])}
            />
            <input
              ref={logoInputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={(event) =>
                void handleLogoUpload(event.target.files?.[0])
              }
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] gap-4 px-4 py-4 lg:grid-cols-[76px_minmax(320px,440px)_1fr] lg:px-6">
        <nav
          className="flex gap-2 overflow-x-auto rounded-md border border-line bg-white p-2 lg:flex-col lg:overflow-visible"
          aria-label="Workspace"
        >
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex h-11 min-w-11 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-ink",
                  section === item.id &&
                    "bg-ink text-white hover:bg-ink hover:text-white",
                )}
              >
                <Icon size={19} aria-hidden="true" />
              </button>
            );
          })}
        </nav>

        <aside className="rounded-md border border-line bg-white p-4 shadow-panel">
          {section === "editor" && (
            <EditorPanel
              tokens={tokens}
              updateToken={updateToken}
              applyTokens={applyTokens}
              applyMode={applyMode}
              reset={reset}
              onPickLogo={() => logoInputRef.current?.click()}
              onRemoveLogo={removeUploadedLogo}
            />
          )}
          {section === "assets" && (
            <AssetPanel
              assets={assets}
              category={category}
              setCategory={setCategory}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          )}
          {section === "batch" && (
            <BatchPanel
              batchText={batchText}
              setBatchText={setBatchText}
              rowCount={batch.rows.length}
              errors={batch.errors}
              onExport={() => void handleBatchExport()}
              busy={busy === "batch"}
            />
          )}
          {section === "validate" && (
            <DoctorPanel
              validation={validation}
              recentExports={recentExports}
            />
          )}
          {section === "usecases" && <UseCasesPanel assets={assets.length} />}
        </aside>

        <section className="min-w-0">
          {section === "usecases" ? (
            <UseCasesPage
              tokens={tokens}
              onCopy={(label, value) => void copySnippet(label, value)}
            />
          ) : (
            <>
              <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_360px]">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="rounded-md border border-line bg-white p-3 shadow-panel"
                >
                  <div
                    ref={previewRef}
                    className="aspect-[1200/630] overflow-hidden rounded-md border border-line bg-[#F8FAFC]"
                  >
                    {featuredAsset ? (
                      <img
                        className="h-full w-full object-cover"
                        src={svgToDataUri(featuredAsset.content)}
                        alt={`${tokens.name} OpenGraph preview`}
                      />
                    ) : (
                      <EmptyState
                        icon={ImageDown}
                        headline="No assets generated"
                        description="Update brand tokens to render a preview."
                        primary="Reset"
                        onPrimary={reset}
                      />
                    )}
                  </div>
                </motion.div>

                <div className="rounded-md border border-line bg-white p-4 shadow-panel">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-ink">Status</h2>
                      <p className="mt-1 text-sm text-[#64748B]">
                        {assets.length} assets ready
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold",
                        validation.ok
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : "bg-[#FEF3C7] text-[#92400E]",
                      )}
                    >
                      {validation.ok ? (
                        <CheckCircle2 size={14} aria-hidden="true" />
                      ) : (
                        <XCircle size={14} aria-hidden="true" />
                      )}
                      {validation.score}/100
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Swatch label="Primary" value={tokens.primary} />
                    <Swatch label="Accent" value={tokens.accent} />
                    <Swatch label="Surface" value={tokens.background} />
                  </div>
                  <div className="mt-4 border-t border-line pt-4">
                    <h3 className="text-sm font-bold text-ink">Templates</h3>
                    <div className="mt-2 grid gap-2">
                      {includedTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() =>
                            setTokens({
                              theme:
                                template.id === "minimal-card"
                                  ? "minimal"
                                  : template.id === "launch-banner"
                                    ? "gradient"
                                    : "modern",
                            })
                          }
                          className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-left text-sm hover:border-[#AAB5C5]"
                        >
                          <span className="font-semibold text-ink">
                            {template.name}
                          </span>
                          <Sparkles
                            size={15}
                            className="text-[#64748B]"
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {(notice || error) && (
                <div
                  className={cn(
                    "mb-4 flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm",
                    error
                      ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]"
                      : "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
                  )}
                >
                  <span>{error ?? notice}</span>
                  <button
                    type="button"
                    className="font-bold"
                    onClick={() => {
                      setNotice(null);
                      setError(null);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      favorite={favorites.includes(asset.id)}
                      onFavorite={() => toggleFavorite(asset.id)}
                      onDownload={() => {
                        downloadText(
                          asset.filename,
                          asset.content,
                          asset.mimeType,
                        );
                        recordExport(asset.filename);
                      }}
                    />
                  ))
                ) : (
                  <div className="sm:col-span-2 xl:col-span-3 2xl:col-span-4">
                    <EmptyState
                      icon={Heart}
                      headline="No favorites"
                      description="Mark assets to keep them in this view."
                      primary="Show all"
                      onPrimary={() => setCategory("all")}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

interface EditorPanelProps {
  tokens: BrandTokens;
  updateToken: <K extends keyof BrandTokens>(
    field: K,
    value: BrandTokens[K],
  ) => void;
  applyTokens: (tokens: Partial<BrandTokens>) => void;
  applyMode: (mode: BrandMode) => void;
  reset: () => void;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
}

function EditorPanel({
  tokens,
  updateToken,
  applyTokens,
  applyMode,
  reset,
  onPickLogo,
  onRemoveLogo,
}: EditorPanelProps) {
  return (
    <div className="grid gap-5">
      <PanelTitle icon={SlidersHorizontal} title="Brand Kit" />
      <div className="grid gap-3">
        <TextField
          label="Name"
          value={tokens.name}
          onChange={(value) => updateToken("name", value)}
        />
        <TextField
          label="Description"
          value={tokens.description}
          onChange={(value) => updateToken("description", value)}
          multiline
        />
        <TextField
          label="Font"
          value={tokens.font}
          onChange={(value) => updateToken("font", value)}
        />
      </div>

      <LogoPanel
        tokens={tokens}
        updateToken={updateToken}
        onPickLogo={onPickLogo}
        onRemoveLogo={onRemoveLogo}
      />

      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label="Primary"
          value={tokens.primary}
          onChange={(value) => updateToken("primary", value)}
        />
        <ColorField
          label="Secondary"
          value={tokens.secondary}
          onChange={(value) => updateToken("secondary", value)}
        />
        <ColorField
          label="Accent"
          value={tokens.accent}
          onChange={(value) => updateToken("accent", value)}
        />
        <ColorField
          label="Background"
          value={tokens.background}
          onChange={(value) => updateToken("background", value)}
        />
        <ColorField
          label="Foreground"
          value={tokens.foreground}
          onChange={(value) => updateToken("foreground", value)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-bold text-ink" htmlFor="radius">
            Radius
          </label>
          <span className="text-xs font-bold text-[#64748B]">
            {tokens.radius}px
          </span>
        </div>
        <input
          id="radius"
          className="w-full accent-[#2563EB]"
          type="range"
          min="0"
          max="64"
          value={tokens.radius}
          onChange={(event) =>
            updateToken("radius", Number(event.target.value))
          }
        />
      </div>

      <div className="grid gap-3">
        <Segmented
          label="Mode"
          value={tokens.mode}
          options={[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
          ]}
          onChange={(value) => applyMode(value as BrandMode)}
        />
        <div>
          <label
            className="mb-2 block text-sm font-bold text-ink"
            htmlFor="theme"
          >
            Theme
          </label>
          <select
            id="theme"
            className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
            value={tokens.theme}
            onChange={(event) =>
              updateToken("theme", event.target.value as BrandTheme)
            }
          >
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {toTitle(theme)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MetaImagePanel
        tokens={tokens}
        updateToken={updateToken}
        applyTokens={applyTokens}
      />

      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Presets</h3>
        <div className="grid gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyTokens(preset)}
              className="flex items-center gap-3 rounded-md border border-line p-2 text-left hover:border-[#AAB5C5]"
            >
              <span
                className="h-7 w-7 rounded-md"
                style={{ background: preset.primary }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink">
                  {preset.name}
                </span>
                <span className="block truncate text-xs text-[#64748B]">
                  {preset.theme}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <Button variant="ghost" onClick={reset}>
        <RefreshCw size={16} aria-hidden="true" />
        Reset
      </Button>
    </div>
  );
}

function LogoPanel({
  tokens,
  updateToken,
  onPickLogo,
  onRemoveLogo,
}: {
  tokens: BrandTokens;
  updateToken: <K extends keyof BrandTokens>(
    field: K,
    value: BrandTokens[K],
  ) => void;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
}) {
  const uploaded = tokens.logoSource === "uploaded";
  const preview = svgToDataUri(renderLogoSvg(tokens, "icon"));

  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <PanelTitle icon={ImagePlus} title="Logo" />
      <div className="flex items-center gap-3 rounded-md border border-line bg-[#F8FAFC] p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white">
          <img
            className="h-full w-full object-contain p-1"
            src={preview}
            alt={`${tokens.name} logo preview`}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">
            {uploaded ? "Uploaded logo" : "Generated logo"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">
            {uploaded && !tokens.logoDataUri
              ? "Pick a logo file to replace the generated mark."
              : "Used in logos, favicons, and social previews."}
          </p>
        </div>
      </div>
      <Segmented
        label="Source"
        value={tokens.logoSource}
        options={[
          { value: "generated", label: "Generate", icon: Wand2 },
          { value: "uploaded", label: "Upload", icon: Upload },
        ]}
        onChange={(value) => updateToken("logoSource", value as LogoSource)}
      />
      {uploaded ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onPickLogo}>
            <Upload size={16} aria-hidden="true" />
            Pick file
          </Button>
          <Button
            variant="ghost"
            onClick={onRemoveLogo}
            disabled={!tokens.logoDataUri}
          >
            <Trash2 size={16} aria-hidden="true" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <SelectField
            label="Shape"
            value={tokens.logoShape}
            options={LOGO_SHAPES}
            onChange={(value) => updateToken("logoShape", value as LogoShape)}
          />
          <SelectField
            label="Mark style"
            value={tokens.logoStyle}
            options={LOGO_STYLES}
            onChange={(value) => updateToken("logoStyle", value as LogoStyle)}
          />
        </div>
      )}
    </div>
  );
}

function MetaImagePanel({
  tokens,
  updateToken,
  applyTokens,
}: {
  tokens: BrandTokens;
  updateToken: <K extends keyof BrandTokens>(
    field: K,
    value: BrandTokens[K],
  ) => void;
  applyTokens: (tokens: Partial<BrandTokens>) => void;
}) {
  const presets: Array<{ label: string; tokens: Partial<BrandTokens> }> = [
    {
      label: "Launch",
      tokens: {
        metaGradient: "aurora",
        metaPattern: "waves",
        metaLayout: "centered",
        metaIntensity: 82,
        theme: "gradient",
      },
    },
    {
      label: "Docs",
      tokens: {
        metaGradient: "solid",
        metaPattern: "grid",
        metaLayout: "classic",
        metaIntensity: 32,
        theme: "minimal",
      },
    },
    {
      label: "Product",
      tokens: {
        metaGradient: "mesh",
        metaPattern: "plus",
        metaLayout: "split",
        metaIntensity: 72,
        theme: "modern",
      },
    },
    {
      label: "Repo",
      tokens: {
        metaGradient: "radial",
        metaPattern: "dots",
        metaLayout: "poster",
        metaIntensity: 58,
        theme: "linear",
      },
    },
  ];

  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <PanelTitle icon={Palette} title="Meta Image" />
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyTokens({ ...tokens, ...preset.tokens })}
            className="rounded-md border border-line bg-white px-3 py-2 text-left text-sm font-semibold text-ink hover:border-[#AAB5C5]"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <Segmented
        label="Layout"
        value={tokens.metaLayout}
        options={[
          { value: "classic", label: "Classic", icon: LayoutGrid },
          { value: "centered", label: "Center", icon: ImageDown },
          { value: "split", label: "Split", icon: Layers3 },
          { value: "poster", label: "Poster", icon: Sparkles },
        ]}
        onChange={(value) => updateToken("metaLayout", value as MetaLayout)}
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Gradient"
          value={tokens.metaGradient}
          options={META_GRADIENTS}
          onChange={(value) =>
            updateToken("metaGradient", value as MetaGradient)
          }
        />
        <SelectField
          label="Pattern"
          value={tokens.metaPattern}
          options={META_PATTERNS}
          onChange={(value) => updateToken("metaPattern", value as MetaPattern)}
        />
      </div>
      <RangeField
        label="Pattern size"
        value={tokens.metaPatternScale}
        min={16}
        max={96}
        suffix="px"
        onChange={(value) => updateToken("metaPatternScale", value)}
      />
      <RangeField
        label="Finish"
        value={tokens.metaIntensity}
        min={0}
        max={100}
        suffix="%"
        onChange={(value) => updateToken("metaIntensity", value)}
      />
    </div>
  );
}

interface AssetPanelProps {
  assets: BrandAsset[];
  category: CategoryFilter;
  setCategory: (category: CategoryFilter) => void;
  favorites: string[];
  toggleFavorite: (assetId: string) => void;
}

function AssetPanel({
  assets,
  category,
  setCategory,
  favorites,
  toggleFavorite,
}: AssetPanelProps) {
  return (
    <div className="grid gap-5">
      <PanelTitle icon={LayoutGrid} title="Assets" />
      <div className="grid grid-cols-2 gap-2">
        {categoryFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setCategory(filter.id)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-semibold",
              category === filter.id
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:border-[#AAB5C5]",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line pt-4 text-sm">
        <Metric label="Assets" value={assets.length.toString()} />
        <Metric label="Favorites" value={favorites.length.toString()} />
      </div>
      {assets.slice(0, 5).map((asset) => (
        <button
          key={asset.id}
          type="button"
          onClick={() => toggleFavorite(asset.id)}
          className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-left text-sm hover:border-[#AAB5C5]"
        >
          <span className="truncate font-semibold text-ink">{asset.name}</span>
          <Heart
            size={15}
            className={
              favorites.includes(asset.id)
                ? "fill-[#F97316] text-[#F97316]"
                : "text-[#94A3B8]"
            }
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

interface BatchPanelProps {
  batchText: string;
  setBatchText: (value: string) => void;
  rowCount: number;
  errors: string[];
  onExport: () => void;
  busy: boolean;
}

function BatchPanel({
  batchText,
  setBatchText,
  rowCount,
  errors,
  onExport,
  busy,
}: BatchPanelProps) {
  return (
    <div className="grid gap-5">
      <PanelTitle icon={FolderSync} title="Batch" />
      <textarea
        className="min-h-52 w-full resize-y rounded-md border border-line bg-white p-3 font-mono text-xs leading-5 text-ink"
        value={batchText}
        onChange={(event) => setBatchText(event.target.value)}
        spellCheck={false}
        aria-label="Batch input"
      />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Metric label="Rows" value={rowCount.toString()} />
        <Metric label="Errors" value={errors.length.toString()} />
      </div>
      {errors.length > 0 && (
        <div className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-sm text-[#991B1B]">
          {errors.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      )}
      <Button
        variant="primary"
        onClick={onExport}
        disabled={busy || rowCount === 0}
      >
        {busy ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <Archive size={16} aria-hidden="true" />
        )}
        Export batch
      </Button>
    </div>
  );
}

function DoctorPanel({
  validation,
  recentExports,
}: {
  validation: ReturnType<typeof validateBrandTokens>;
  recentExports: string[];
}) {
  return (
    <div className="grid gap-5">
      <PanelTitle icon={SearchCheck} title="Doctor" />
      <div className="rounded-md border border-line bg-[#F8FAFC] p-4">
        <p className="text-3xl font-black text-ink">{validation.score}</p>
        <p className="text-sm text-[#64748B]">Validation score</p>
      </div>
      {validation.issues.length > 0 ? (
        <div className="grid gap-2">
          {validation.issues.map((issue) => (
            <div key={issue.id} className="rounded-md border border-line p-3">
              <p className="text-sm font-bold text-ink">{issue.title}</p>
              <p className="mt-1 text-sm text-[#64748B]">{issue.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BadgeCheck}
          headline="No issues"
          description="Tokens pass the current validator set."
          primary="Ready"
        />
      )}
      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-bold text-ink">Recent Exports</h3>
        {recentExports.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {recentExports.map((item) => (
              <p
                key={item}
                className="rounded-md border border-line px-3 py-2 text-sm text-[#475569]"
              >
                {item}
              </p>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Archive}
            headline="No exports"
            description="Generated files appear here after download."
            primary="Ready"
          />
        )}
      </div>
    </div>
  );
}

function UseCasesPanel({ assets }: { assets: number }) {
  return (
    <div className="grid gap-5">
      <PanelTitle icon={Globe2} title="Use Cases" />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Metric label="Outputs" value={assets.toString()} />
        <Metric label="LLM tools" value="4" />
      </div>
      <div className="rounded-md border border-line bg-[#F8FAFC] p-3 text-sm leading-6 text-[#475569]">
        BrandKit OS is local-first. Public generation endpoints, MCP servers,
        auth, queues, and storage are bring-your-own hosting.
      </div>
      <div className="grid gap-2">
        {[
          "Social previews",
          "Logos and favicons",
          "Repository assets",
          "CLI automation",
          "LLM/MCP adapters",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
          >
            <CheckCircle2
              size={15}
              className="text-[#16A34A]"
              aria-hidden="true"
            />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function UseCasesPage({
  tokens,
  onCopy,
}: {
  tokens: BrandTokens;
  onCopy: (label: string, value: string) => void;
}) {
  const tokenSample = JSON.stringify(
    {
      name: tokens.name,
      description: tokens.description,
      primary: tokens.primary,
      accent: tokens.accent,
      logoSource: tokens.logoSource,
      logoShape: tokens.logoShape,
      metaGradient: tokens.metaGradient,
      metaPattern: tokens.metaPattern,
      metaLayout: tokens.metaLayout,
    },
    null,
    2,
  );

  const cliSnippet = `npm run brandkit -- init
npm run brandkit -- generate
npm run brandkit -- sync
npm run brandkit -- doctor
npm run brandkit -- batch brands.csv
npm run brandkit -- mcp`;

  const sdkSnippet = `import { generateBrandKit, generateOG, getBrandKitToolManifest } from "@brandkit/sdk";

const kit = generateBrandKit(${tokenSample});
const ogSvg = generateOG({ ...kit.tokens, width: 1200, height: 630 });
const llmTools = getBrandKitToolManifest();`;

  const mcpSnippet = `{
  "toolSource": "brandkit mcp",
  "hosting": "self-hosted",
  "tools": [
    "brandkit_generate",
    "brandkit_render_meta_image",
    "brandkit_validate",
    "brandkit_batch"
  ]
}`;

  const useCases = [
    {
      icon: ImageDown,
      title: "Launch meta images",
      copy: "Generate OpenGraph, Twitter, Product Hunt, newsletter, blog, and YouTube-ready SVGs from one token file.",
    },
    {
      icon: ImagePlus,
      title: "Logo system",
      copy: "Use the built-in generated mark, upload a custom logo, then export icon, horizontal, vertical, light, and dark variants.",
    },
    {
      icon: FileJson,
      title: "Versioned brand.json",
      copy: "Keep brand tokens in Git and regenerate deterministic assets during reviews, releases, or docs updates.",
    },
    {
      icon: Terminal,
      title: "CLI pipelines",
      copy: "Run init, generate, sync, validate, doctor, export, and batch commands in local scripts or CI.",
    },
    {
      icon: Bot,
      title: "LLM generation",
      copy: "Expose the MCP/tool manifest to an agent so it can produce validated tokens and request exact assets.",
    },
    {
      icon: Server,
      title: "Own hosted endpoint",
      copy: "Wrap @brandkit/core behind your API when teams need shared generation, queues, storage, auth, or MCP access.",
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-line bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">
              Use cases and integrations
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475569]">
              Generate assets locally from deterministic tokens, or connect the
              same core engine to your own hosted LLM/MCP workflow.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => onCopy("Brand token sample", tokenSample)}
          >
            <CopyIcon size={16} aria-hidden="true" />
            Copy tokens
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {useCases.map((item) => (
          <UseCaseCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            copy={item.copy}
          />
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <SnippetCard
          icon={Terminal}
          title="CLI surface"
          value={cliSnippet}
          onCopy={() => onCopy("CLI commands", cliSnippet)}
        />
        <SnippetCard
          icon={Code2}
          title="SDK surface"
          value={sdkSnippet}
          onCopy={() => onCopy("SDK snippet", sdkSnippet)}
        />
        <SnippetCard
          icon={Bot}
          title="MCP manifest"
          value={mcpSnippet}
          onCopy={() => onCopy("MCP manifest", mcpSnippet)}
        />
      </div>

      <div className="rounded-md border border-line bg-[#F8FAFC] p-4">
        <h3 className="text-sm font-bold text-ink">CLI and MCP coverage</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {[
            "init",
            "generate/build",
            "export",
            "sync",
            "doctor",
            "validate",
            "batch",
            "mcp manifest",
          ].map((item) => (
            <div
              key={item}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof ImageDown;
  title: string;
  copy: string;
}) {
  return (
    <article className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E0F2FE] text-[#0369A1]">
        <Icon size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{copy}</p>
    </article>
  );
}

function SnippetCard({
  icon: Icon,
  title,
  value,
  onCopy,
}: {
  icon: typeof Terminal;
  title: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <article className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-[#2563EB]" aria-hidden="true" />
          <h3 className="text-sm font-bold text-ink">{title}</h3>
        </div>
        <button
          type="button"
          title={`Copy ${title}`}
          aria-label={`Copy ${title}`}
          onClick={onCopy}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line hover:border-[#AAB5C5]"
        >
          <CopyIcon size={16} className="text-[#64748B]" aria-hidden="true" />
        </button>
      </div>
      <pre className="max-h-80 overflow-auto rounded-md bg-[#0F172A] p-3 text-xs leading-5 text-[#E2E8F0]">
        <code>{value}</code>
      </pre>
    </article>
  );
}

function AssetCard({
  asset,
  favorite,
  onFavorite,
  onDownload,
}: {
  asset: BrandAsset;
  favorite: boolean;
  onFavorite: () => void;
  onDownload: () => void;
}) {
  return (
    <article className="rounded-md border border-line bg-white p-3 shadow-panel">
      <div className="aspect-[16/9] overflow-hidden rounded-md border border-line bg-[#F8FAFC]">
        {asset.format === "svg" ? (
          <img
            className="h-full w-full object-contain p-2"
            src={svgToDataUri(asset.content)}
            alt={`${asset.name} preview`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#64748B]">
            <Braces size={34} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink">{asset.name}</h3>
          <p className="mt-1 truncate text-xs text-[#64748B]">
            {asset.width && asset.height
              ? `${asset.width}x${asset.height}`
              : asset.format.toUpperCase()}{" "}
            · {asset.filename}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            title="Favorite asset"
            aria-label="Favorite asset"
            onClick={onFavorite}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line hover:border-[#AAB5C5]"
          >
            <Heart
              size={16}
              className={
                favorite ? "fill-[#F97316] text-[#F97316]" : "text-[#64748B]"
              }
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            title="Download asset"
            aria-label="Download asset"
            onClick={onDownload}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line hover:border-[#AAB5C5]"
          >
            <Download size={16} className="text-[#64748B]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-ink" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className="min-h-24 w-full resize-y rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase();
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-ink" htmlFor={id}>
        {label}
      </label>
      <div className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-2">
        <input
          id={id}
          type="color"
          className="h-7 w-8 shrink-0 border-0 bg-transparent p-0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} color`}
        />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} hex`}
        />
      </div>
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-ink" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {toTitle(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-bold text-ink" htmlFor={id}>
          {label}
        </label>
        <span className="text-xs font-bold text-[#64748B]">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        className="w-full accent-[#2563EB]"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; icon: typeof Sun }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-ink">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold transition",
                value === option.value
                  ? "border-[#1D4ED8] bg-[#2563EB] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]"
                  : "border-line bg-white text-ink hover:border-[#AAB5C5] hover:bg-[#F8FAFC]",
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PanelTitle({
  icon: Icon,
  title,
}: {
  icon: typeof SlidersHorizontal;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-[#2563EB]" aria-hidden="true" />
      <h2 className="text-sm font-black uppercase text-ink">{title}</h2>
    </div>
  );
}

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line p-2">
      <div className="h-9 rounded-md" style={{ background: value }} />
      <p className="mt-2 truncate text-xs font-bold text-ink">{label}</p>
      <p className="truncate text-xs text-[#64748B]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-lg font-black text-ink">{value}</p>
      <p className="text-xs text-[#64748B]">{label}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  headline,
  description,
  primary,
  onPrimary,
}: {
  icon: typeof Archive;
  headline: string;
  description: string;
  primary: string;
  onPrimary?: () => void;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-line bg-white p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#E0F2FE] text-[#0369A1]">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-ink">{headline}</h3>
      <p className="mt-1 max-w-72 text-sm text-[#64748B]">{description}</p>
      {onPrimary ? (
        <Button className="mt-4" variant="secondary" onClick={onPrimary}>
          {primary}
        </Button>
      ) : (
        <span className="mt-4 inline-flex h-9 items-center rounded-md border border-line px-3 text-sm font-semibold text-[#64748B]">
          {primary}
        </span>
      )}
    </div>
  );
}

function toTitle(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file."));
    });
    reader.addEventListener("error", () =>
      reject(reader.error ?? new Error("Unable to read file.")),
    );
    reader.readAsDataURL(file);
  });
}

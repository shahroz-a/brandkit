import type { BrandAsset, BrandTokens, ValidationIssue } from "@brandkit/core";

export interface BrandKitPlugin {
  name: string;
  version: string;
  templates?: PluginTemplate[];
  themes?: PluginTheme[];
  generators?: PluginGenerator[];
  validators?: PluginValidator[];
  exporters?: PluginExporter[];
  commands?: PluginCommand[];
}

export interface PluginTemplate {
  id: string;
  name: string;
  render: (tokens: BrandTokens) => BrandAsset;
}

export interface PluginTheme {
  id: string;
  name: string;
  tokens: Partial<BrandTokens>;
}

export interface PluginGenerator {
  id: string;
  name: string;
  generate: (tokens: BrandTokens) => BrandAsset | BrandAsset[];
}

export interface PluginValidator {
  id: string;
  name: string;
  validate: (tokens: BrandTokens, assets: BrandAsset[]) => ValidationIssue[];
}

export interface PluginExporter {
  id: string;
  name: string;
  export: (assets: BrandAsset[]) => Promise<Uint8Array> | Uint8Array;
}

export interface PluginCommand {
  name: string;
  description: string;
  run: (args: string[]) => Promise<void> | void;
}

export function definePlugin(plugin: BrandKitPlugin): BrandKitPlugin {
  if (!plugin.name.trim()) {
    throw new Error("Plugin name is required.");
  }

  if (!plugin.version.trim()) {
    throw new Error("Plugin version is required.");
  }

  return plugin;
}

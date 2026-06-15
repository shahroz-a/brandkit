/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.CF_PAGES === "1" || process.env.CLOUDFLARE_BUILD === "1" ? "export" : "standalone",
  transpilePackages: ["@brandkit/core", "@brandkit/presets", "@brandkit/templates"]
};

export default nextConfig;

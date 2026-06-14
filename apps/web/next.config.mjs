/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@brandkit/core", "@brandkit/presets", "@brandkit/templates"]
};

export default nextConfig;

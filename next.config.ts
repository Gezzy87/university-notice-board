import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cover image uploads go through a Server Action (FormData). The default
    // request-body cap is 1MB; raise it above our 5MB image limit + overhead.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  // isomorphic-dompurify pulls in jsdom for server-side sanitization. Bundling
  // it (the default) breaks on Vercel's serverless runtime with
  // "ERR_REQUIRE_ESM" because of jsdom's CJS/ESM interop. Marking it external
  // makes Next.js require() it at runtime instead of bundling it.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
};

export default nextConfig;

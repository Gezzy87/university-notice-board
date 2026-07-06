import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cover image uploads go through a Server Action (FormData). The default
    // request-body cap is 1MB; raise it above our 5MB image limit + overhead.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

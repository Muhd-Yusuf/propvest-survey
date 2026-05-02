import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Powered-By", value: "" },
        { key: "Server", value: "" },
      ],
    },
  ],
};

export default nextConfig;

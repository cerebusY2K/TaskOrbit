import type { NextConfig } from "next";

const firebaseHost = `https://${process.env.FIREBASE_PROJECT_ID || "gocorona-52deb"}.firebaseapp.com`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/__/auth/:path*", destination: `${firebaseHost}/__/auth/:path*` }];
  },
};

export default nextConfig;

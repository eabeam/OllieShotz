import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Use turbopack config to silence build warning
  // next-pwa uses webpack, which is still supported
  turbopack: {},
};

export default withPWA(nextConfig);

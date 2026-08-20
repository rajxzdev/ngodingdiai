/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dev-only: preview live diakses lewat domain e2b.app — matikan warning cross-origin
  allowedDevOrigins: ["*"],
};

export default nextConfig;

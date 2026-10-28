import { readFileSync } from "node:fs";

// A placeholder inherited from an older .env or shell must not override the
// local secret. Keep the value in process.env so middleware receives it too.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith("your-")) {
  try {
    const lines = readFileSync(new URL(".env.local", import.meta.url), "utf8").split(/\r?\n/);
    const entry = lines.find((line) => /^\s*JWT_SECRET\s*=/.test(line));
    const value = entry?.replace(/^\s*JWT_SECRET\s*=\s*/, "").trim().replace(/^(['"])(.*)\1$/, "$2");
    if (value && value.length >= 32 && !value.startsWith("your-")) {
      process.env.JWT_SECRET = value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

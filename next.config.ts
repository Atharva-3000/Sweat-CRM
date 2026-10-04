import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs is a Node-only library; keep it out of the server bundle.
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;

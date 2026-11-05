import type { NextConfig } from "next";

// 닥터J커브(drjcurve) 사이트의 /toolkit 경로 아래에서 서비스된다.
// Netlify가 /toolkit/* 요청을 이 사이트로 프록시하므로 모든 링크·자산 경로에 basePath가 붙어야 한다.
export const BASE_PATH = "/toolkit";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;

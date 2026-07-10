import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @hap/core는 빌드 없이 TS 소스를 직접 노출하는 워크스페이스 패키지 → Next가 트랜스파일
  transpilePackages: ["@hap/core"],
};

export default nextConfig;

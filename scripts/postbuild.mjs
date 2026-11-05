// next export는 basePath와 무관하게 out/ 루트에 파일을 쓴다.
// Cloudflare Workers 자산이 /toolkit/ 아래에서 서비스되도록 dist/toolkit/ 으로 옮기고,
// 404 페이지는 자산 루트에도 복사한다.
import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/toolkit", { recursive: true });
cpSync("out", "dist/toolkit", { recursive: true });
if (existsSync("dist/toolkit/404.html")) copyFileSync("dist/toolkit/404.html", "dist/404.html");
// 루트 접근은 도구함 홈으로
writeFileSync("dist/_redirects", "/  /toolkit/  302\n");
if (existsSync("out/_headers")) copyFileSync("out/_headers", "dist/_headers");
console.log("postbuild: dist/toolkit ready");

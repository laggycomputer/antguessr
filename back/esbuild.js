import * as esbuild from "esbuild"

await esbuild.build({
    entryPoints: ["src/server.ts"],
    bundle: true,
    platform: "node",
    packages: "external",
    format: "esm",
    outfile: "server.bundle.js",
})

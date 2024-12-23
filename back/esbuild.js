import * as esbuild from "esbuild"

await esbuild.build({
    entryPoints: ["server.ts"],
    bundle: true,
    platform: "node",
    packages: "external",
    format: "esm",
    outfile: "server.bundle.js",
})

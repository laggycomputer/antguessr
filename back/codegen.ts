import type { CodegenConfig } from "@graphql-codegen/cli"

const config: CodegenConfig = {
    schema: "https://anteaterapi.com/v2/graphql",
    documents: ["src/**/*.tsx"],
    ignoreNoDocuments: true,
    generates: {
        "./src/graphql/": {
            preset: "client",
        },
        "./schema.graphql": {
            plugins: ["schema-ast"],
            config: {
                includeDirectives: true,
            },
        },
    },
}
export default config

import globals from "globals"
import pluginJs from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import parserTs from "@typescript-eslint/parser"

export default [
    {
        files: [
            "**/*.js",
            "**/*.mjs",
            "**/*.cjs",
            "**/*.ts",
        ],
    },
    {
        ignores: [
            "dist/**",
            "src/server.bundle.js",
            "src/anteaterapi.d.ts",
        ],
    },
    pluginJs.configs.recommended,
    stylistic.configs["recommended-flat"],
    {
        languageOptions: {
            parser: parserTs,
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: {
            "@stylistic": stylistic,
        },
        rules: {
            "@stylistic/indent": [
                "error",
                4,
                { SwitchCase: 1 },
            ],
            "@stylistic/indent-binary-ops": [
                "error",
                4,
            ],
            "@stylistic/linebreak-style": [
                "error",
                "unix",
            ],
            "@stylistic/brace-style": [
                "error",
                "1tbs",
                { allowSingleLine: true },
            ],
            "@stylistic/quotes": [
                "error",
                "double",
            ],
            "@stylistic/semi": [
                "error",
                "never",
            ],
            "@stylistic/comma-dangle": [
                "error",
                "always-multiline",
            ],
            "@stylistic/member-delimiter-style": [
                "error",
                {
                    multiline: {
                        delimiter: "none",
                        requireLast: true,
                    },
                    singleline: {
                        delimiter: "comma",
                        requireLast: false,
                    },
                    multilineDetection: "brackets",
                },
            ],
            "@stylistic/max-statements-per-line": [
                "error",
                { max: 2 },
            ],
        },
    },
]

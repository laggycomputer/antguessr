import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist'] },
    {
        rules: {
            "@stylistic/indent": ["error", 4, {
                SwitchCase: 1,
            }],
            "@stylistic/indent-binary-ops": ["error", 4],
            "@stylistic/linebreak-style": ["error", "unix"],
            "@stylistic/brace-style": ["error", "1tbs", {
                allowSingleLine: true,
            }],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": ["error", "never"],
            "@stylistic/comma-dangle": ["error", "always-multiline"],
            "@stylistic/member-delimiter-style": ["error", {
                multiline: {
                    delimiter: "none",
                    requireLast: true,
                },

                singleline: {
                    delimiter: "comma",
                    requireLast: false,
                },

                multilineDetection: "brackets",
            }],
            "@stylistic/max-statements-per-line": ["error", {
                max: 2,
            }],
            "curly": ["error", "all"],
            "eqeqeq": ["error", "always"],
        },
    },
)

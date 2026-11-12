// Configuração do ESLint (flat config) do backend do OLA.
// Usada pela checagem "Linter" da pipeline de CI: qualquer erro ou aviso reprova o build.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";

export default tseslint.config(
  {
    // Código gerado e artefatos de build não são analisados.
    ignores: ["dist/**", "coverage/**", "node_modules/**", "src/generated/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.jest }
    },
    plugins: { "@stylistic": stylistic },
    rules: {
      // Erros comuns
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      curly: ["error", "all"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "error",

      // Estilo do grupo
      "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/max-len": ["error", { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/eol-last": ["error", "always"]
    }
  },
  {
    // Arquivos JS de configuração (CommonJS)
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: { ...globals.node } }
  }
);

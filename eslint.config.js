import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
  globalIgnores(["./tests/data/**/*"]),
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
);

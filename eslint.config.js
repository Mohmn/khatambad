import js from "@eslint/js"; // Ensure you have the correct package for ESLint JS rules
import prettier from "eslint-config-prettier";
import globals from "globals"; // This should be installed or defined if it's a custom file

export default [
  js.configs.recommended,
  {
    ignores: [
      "**/node_modules",
      "**/dist",
      "**/build",
      "**/__snapshots__",
      "**/mocks",
      "**/coverage",
    ],
    files: ["src/**/*.js"],
    rules: {
      semi: ["warn", "always"],
      indent: ["error", 2],
      "no-unused-vars": "warn",
      "no-useless-catch": "off",
    },
    plugins: {
      prettier: prettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        // ...globals.browser,
        // myCustomGlobal: "readonly"  // Uncomment or add your custom globals as needed
      },
    },
  },
];

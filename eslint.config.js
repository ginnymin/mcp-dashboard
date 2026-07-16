import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tailwindcss from "eslint-plugin-tailwindcss";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

const restrictedSyntax = [
  {
    selector: "FunctionDeclaration",
    message:
      "Use arrow function syntax (const name = () => {}) instead of function declarations.",
  },
  {
    selector: "Literal[value=/\\[#[0-9a-fA-F]/]",
    message:
      "Use theme tokens instead of arbitrary Tailwind hex colors ([#…]). See PLAN.md §4.3.",
  },
  {
    selector: "TemplateElement[value.raw=/\\[#[0-9a-fA-F]/]",
    message:
      "Use theme tokens instead of arbitrary Tailwind hex colors ([#…]). See PLAN.md §4.3.",
  },
  {
    selector: "Literal[value=/\\bgroup-hover:/]",
    message:
      "Use named group variants (group/{name}-hover:) instead of bare group-hover:.",
  },
  {
    selector: "TemplateElement[value.raw=/\\bgroup-hover:/]",
    message:
      "Use named group variants (group/{name}-hover:) instead of bare group-hover:.",
  },
  {
    selector: "Literal[value=/\\bpeer-hover:/]",
    message:
      "Use named peer variants (peer/{name}-hover:) instead of bare peer-hover:.",
  },
  {
    selector: "TemplateElement[value.raw=/\\bpeer-hover:/]",
    message:
      "Use named peer variants (peer/{name}-hover:) instead of bare peer-hover:.",
  },
  {
    selector: "Literal[value=/(?:^|\\s)@container(?!\\/)/]",
    message:
      "Use named container queries (@container/{name}) instead of bare @container.",
  },
  {
    selector: "TemplateElement[value.raw=/(?:^|\\s)@container(?!\\/)/]",
    message:
      "Use named container queries (@container/{name}) instead of bare @container.",
  },
];

const paddingLineRules = [
  { blankLine: "always", prev: "import", next: "*" },
  { blankLine: "any", prev: "import", next: "import" },
  { blankLine: "always", prev: ["interface", "type"], next: "*" },
  { blankLine: "always", prev: ["const", "let", "var"], next: "export" },
  { blankLine: "always", prev: "*", next: "return" },
];

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "scripts/**",
      "server/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts"],
    plugins: {
      "@stylistic": stylistic,
      "unused-imports": unusedImports,
      tailwindcss,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      tailwindcss: {
        callees: ["cn", "cva", "clsx"],
        cssFiles: ["src/app.css"],
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-restricted-syntax": ["error", ...restrictedSyntax],
      "@typescript-eslint/no-unused-vars": "off",
      "@stylistic/padding-line-between-statements": [
        "error",
        ...paddingLineRules,
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
      "tailwindcss/classnames-order": "off",
      "tailwindcss/no-custom-classname": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/jsx-no-useless-fragment": "warn",
      "react/no-danger": "error",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/self-closing-comp": "warn",
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);

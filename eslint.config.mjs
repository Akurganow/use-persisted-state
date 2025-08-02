// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Base JS rules
  eslint.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // React configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Base formatting rules (migrated from .eslintrc.js)
      'indent': [0, 0],
      'semi': [2, 'never'],
      'quotes': ['error', 'single'],
      'block-spacing': [2, 'always'],
      
      // TypeScript rules (migrated and updated)
      '@typescript-eslint/indent': [0],
      '@typescript-eslint/no-explicit-any': [0],
      '@typescript-eslint/ban-types': [0],
      '@typescript-eslint/explicit-function-return-type': [0],
      
      // Arrow function rules
      'arrow-parens': [2, 'as-needed', {requireForBlockBody: false}],
      'no-use-before-define': [1],
      'camelcase': [0],
      'quote-props': [2, 'consistent-as-needed'],
      'no-restricted-globals': [0],
      'no-restricted-properties': [0],
      'no-confusing-arrow': [0],
      'implicit-arrow-linebreak': [0],
      'no-underscore-dangle': [0],
      'comma-dangle': [2, 'always-multiline'],
      'max-len': [2, 120, {ignoreComments: true, ignoreUrls: true}],
      
      // React rules (migrated from .eslintrc.js)
      ...reactPlugin.configs.recommended.rules,
      'react/jsx-filename-extension': [0],
      'react/prefer-stateless-function': [0],
      'react/require-default-props': [0],
      'react/no-array-index-key': [0],
      'react/style-prop-object': [0],
      'react/forbid-prop-types': [1],
      'react/destructuring-assignment': [0],
      'react/no-access-state-in-setstate': [0],
      'react/jsx-first-prop-new-line': [2, 'multiline'],
      'react/jsx-max-props-per-line': [2, {maximum: 1, when: 'multiline'}],
      'react/jsx-one-expression-per-line': [0],
      'react/jsx-props-no-spreading': [0],
      'react/jsx-wrap-multilines': [
        2,
        {
          assignment: false,
          arrow: false,
          return: false,
          declaration: false,
        },
      ],
      'react/jsx-tag-spacing': [
        2,
        {
          closingSlash: 'never',
          beforeSelfClosing: 'always',
          afterOpening: 'never',
        },
      ],
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Test files configuration
  {
    files: ['**/__tests__/**/*.{js,ts,tsx}', '**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },

  // Ignore patterns (replaces .eslintignore)
  {
    ignores: ['node_modules/', 'lib/', 'dist/', 'coverage/'],
  },
);
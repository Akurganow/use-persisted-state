const path = require('path')

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
    es6: true,
    browser: true,
    jest: true,
  },
  globals: {
    device: true,
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    'jest-enzyme',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
    'prettier',
  ],
  rules: {
    'indent': [0, 0],
    'semi': [2, 'never'],
    '@typescript-eslint/indent': [0],
    '@typescript-eslint/camelcase': [0],
    'prettier/prettier': 'error',
    'arrow-parens': [2, 'as-needed', { requireForBlockBody: false }],
    'no-use-before-define': [1],
    'camelcase': [0],
    'quote-props': [2, 'consistent-as-needed'],
    'no-restricted-globals': [0],
    'no-restricted-properties': [0],
    'no-confusing-arrow': [0],
    'implicit-arrow-linebreak': [0],
    'no-underscore-dangle': [0],
    'comma-dangle': [2, 'always-multiline'],
    'max-len': [2, 120, { ignoreComments: true, ignoreUrls: true }],
  },
}

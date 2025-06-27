const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const pluginJest = require('eslint-plugin-jest');

module.exports = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            parser: tseslint.parser,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            'no-cond-assign': 'warn',
            'no-constant-condition': 'warn',
            'no-unused-vars': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        files: ['test/**/*.{ts,tsx,js,jsx}'],
        plugins: {
            jest: pluginJest,
        },
        languageOptions: {
            globals: {
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly',
            },
        },
        rules: {
        },
    },
];

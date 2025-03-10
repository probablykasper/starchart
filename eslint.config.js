import prettier from 'eslint-config-prettier'
import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import ts from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				svelteFeatures: {
					experimentalGenerics: true,
				},
			},
		},
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/'],
	},
	{
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'variableLike',
					format: ['snake_case', 'UPPER_CASE'],
					leadingUnderscore: 'allow',
				},
				{
					selector: 'parameter',
					modifiers: ['destructured'],
					format: null,
				},
				{
					selector: 'variable',
					modifiers: ['destructured'],
					format: null,
				},
			],
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ caughtErrorsIgnorePattern: '^_', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'svelte/button-has-type': 'error',
		},
	},
]

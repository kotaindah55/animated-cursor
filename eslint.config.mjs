import { defineConfig } from 'eslint/config';
import globals from 'globals';
import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import obsidianmdlint from 'eslint-plugin-obsidianmd';
import tsParser from '@typescript-eslint/parser';

export default defineConfig({
	files: [
		'**/*.{ts,mts}'
	],
	ignores: [
		'**/.deprecated/',
		'**/@external',
		'**/node_modules/',
		'**/libs/',
		'**/dist/',
		'**/main.js',
		'**/esbuild.config.mjs',
		'**/eslint.config.mjs'
	],
	extends: [
		eslint.configs.recommended,
		...tslint.configs.strictTypeChecked,
		...tslint.configs.stylisticTypeChecked,
		...obsidianmdlint.configs.recommended
	],
	languageOptions: {
		globals: { ...globals.node },
		parser: tsParser,
		parserOptions: {
			projectService: true,
			tsconfigRootDir: import.meta.dirname
		},
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	rules: {
		'prefer-const': 'off',
		'no-unused-vars': 'off',
		'no-unused-labels': 'off',
		'no-undef': 'off',
		'no-prototype-builtins': 'off',
		'no-cond-assign': 'off',
		'obsidianmd/ui/sentence-case': [
			'error', { ignoreWords: ['cursor'] }
		],
		'obsidianmd/ui/sentence-case-locale-module': [
			'error', { brands: [] }
		],
		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/await-thenable': 'off',
		'@typescript-eslint/no-unsafe-argument': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-unsafe-member-access': 'off',
		'@typescript-eslint/no-unsafe-call': 'off',
		'@typescript-eslint/no-explicit-any': [
			'error', { ignoreRestArgs: true }
		],
		'@typescript-eslint/no-unused-vars': [
			'error', { args: 'none' },
		],
		'@typescript-eslint/no-confusing-void-expression': [
			'error', {
				ignoreVoidOperator: true,
				ignoreArrowShorthand: true
			}
		],
		'@typescript-eslint/no-non-null-assertion': 'warn',
		'@typescript-eslint/restrict-template-expressions': [
			'error', { allowNumber: true }
		]
	}
});
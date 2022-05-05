module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    },
    'plugins': [
        'svelte3',
        '@typescript-eslint',
    ],
    'overrides': [
        {
            'files': ['*.svelte'],
            'processor': 'svelte3/svelte3'
        }
    ],
    'rules': {
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'arrow-spacing': { 'before': true, 'after': true },
    },
    'settings': {
        'svelte3/typescript': true,
    }
};

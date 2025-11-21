// Minificadores no lado do cliente, cobrindo HTML, CSS, JS, JSON e PHP
class ClientMinifier {
    static get SUPPORTED_TYPES() {
        return ['html', 'css', 'js', 'json', 'php'];
    }

    static normalizeOptions(options = {}) {
        return {
            removeComments: options.removeComments !== false,
            removeSpaces: options.removeSpaces !== false,
            removeLineBreaks: options.removeLineBreaks !== false
        };
    }

    static minifyHTML(code, options = {}) {
        const opts = this.normalizeOptions(options);
        let minified = code;

        if (opts.removeComments) {
            minified = minified.replace(/<!--[\s\S]*?-->/g, '');
        }

        if (opts.removeSpaces) {
            minified = minified.replace(/\s+/g, ' ');
            minified = minified.replace(/>\s+</g, '><');
        }

        if (opts.removeLineBreaks) {
            minified = minified.replace(/[\n\r\t]+/g, '');
        }

        return minified.trim();
    }

    static minifyCSS(code, options = {}) {
        const opts = this.normalizeOptions(options);
        let minified = code;

        if (opts.removeComments) {
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
        }

        if (opts.removeSpaces) {
            minified = minified.replace(/\s+/g, ' ');
            minified = minified.replace(/\s*{\s*/g, '{');
            minified = minified.replace(/\s*}\s*/g, '}');
            minified = minified.replace(/\s*;\s*/g, ';');
            minified = minified.replace(/\s*:\s*/g, ':');
            minified = minified.replace(/\s*,\s*/g, ',');
        }

        if (opts.removeLineBreaks) {
            minified = minified.replace(/[\n\r\t]+/g, '');
        }

        return minified.trim();
    }

    static minifyJS(code, options = {}) {
        const opts = this.normalizeOptions(options);
        const placeholder = '__SPACE_PLACEHOLDER__';
        let minified = code;

        if (opts.removeComments) {
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
            minified = minified.replace(/(^|\s)\/\/.*$/gm, '$1');
        }

        if (opts.removeSpaces) {
            minified = this.preserveStringSpaces(minified, placeholder);
            minified = minified.replace(/\s+/g, ' ');
            minified = minified.replace(/\s*([=+\-*\/%&|^!<>?{}();:,])\s*/g, '$1');
            minified = minified.replace(new RegExp(placeholder, 'g'), ' ');
        }

        if (opts.removeLineBreaks) {
            minified = minified.replace(/[\n\r\t]+/g, ' ');
        }

        return minified.trim();
    }

    static minifyJSON(code) {
        try {
            const parsed = JSON.parse(code);
            return JSON.stringify(parsed);
        } catch (error) {
            console.warn('JSON inválido para minificação:', error);
            return code.trim();
        }
    }

    static minifyPHP(code, options = {}) {
        const opts = this.normalizeOptions(options);
        const placeholder = '__SPACE_PLACEHOLDER__';
        let minified = code;

        if (opts.removeComments) {
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
            minified = minified.replace(/(^|\s)\/\/.*$/gm, '$1');
            minified = minified.replace(/(^|\s)#.*$/gm, '$1');
        }

        if (opts.removeSpaces) {
            minified = this.preserveStringSpaces(minified, placeholder);
            minified = minified.replace(/\s+/g, ' ');
            minified = minified.replace(/\s*([=+\-*\/%&|^!<>?{}();:,])\s*/g, '$1');
            minified = minified.replace(new RegExp(placeholder, 'g'), ' ');
        }

        if (opts.removeLineBreaks) {
            minified = minified.replace(/[\n\r\t]+/g, ' ');
        }

        return minified.trim();
    }

    static preserveStringSpaces(code, placeholder) {
        const stringRegex = /(['"])(?:(?=(\\?))\2.)*?\1/g;
        return code.replace(stringRegex, (match) => match.replace(/ /g, placeholder));
    }

    static minifyCode(code, fileType, options = {}) {
        const normalizedType = (fileType || '').toLowerCase();

        switch (normalizedType) {
            case 'html':
                return this.minifyHTML(code, options);
            case 'css':
                return this.minifyCSS(code, options);
            case 'js':
                return this.minifyJS(code, options);
            case 'json':
                return this.minifyJSON(code);
            case 'php':
                return this.minifyPHP(code, options);
            default:
                return code;
        }
    }

    static detectLanguage(code = '', fileName = '') {
        const extension = this.getExtension(fileName);
        if (extension) {
            const mapped = this.getExtensionMap()[extension];
            if (mapped) {
                return mapped;
            }
        }

        const snippet = (code || '').trim();
        if (!snippet) {
            return 'text';
        }

        if (snippet.includes('<?php')) {
            return 'php';
        }

        if (/^<(!DOCTYPE|html|head|body|div|span|script|style|\?xml)/i.test(snippet) || (/<[a-z][\s\S]*?>/i.test(snippet) && /<\/[a-z]/i.test(snippet))) {
            return 'html';
        }

        if (this.looksLikeJSON(snippet)) {
            return 'json';
        }

        if (this.looksLikeCSS(snippet)) {
            return 'css';
        }

        if (this.looksLikeJS(snippet)) {
            return 'js';
        }

        return 'text';
    }

    static looksLikeJSON(code) {
        if (!code) return false;
        const trimmed = code.trim();
        if (!trimmed) return false;
        const first = trimmed[0];
        const last = trimmed[trimmed.length - 1];
        if (!((first === '{' && last === '}') || (first === '[' && last === ']'))) {
            return false;
        }

        try {
            JSON.parse(trimmed);
            return true;
        } catch (error) {
            return false;
        }
    }

    static looksLikeCSS(code) {
        const hasBraces = /\{[\s\S]*?\}/.test(code);
        const hasSelectors = /[.#@]?[a-zA-Z0-9\-\s]+\{/.test(code);
        const jsIndicators = /(function\s|\bconst\b|\bclass\b|=>|import\s)/;
        return hasBraces && hasSelectors && !jsIndicators.test(code);
    }

    static looksLikeJS(code) {
        return /(function\s|\bconst\b|\bclass\b|\bimport\b|=>|\bvar\b|\blet\b|document\.|window\.)/.test(code);
    }

    static getExtension(fileName = '') {
        const parts = fileName.split('.');
        if (parts.length < 2) return '';
        return parts.pop().toLowerCase();
    }

    static getExtensionMap() {
        return {
            html: 'html',
            htm: 'html',
            css: 'css',
            js: 'js',
            mjs: 'js',
            cjs: 'js',
            json: 'json',
            php: 'php',
            phtml: 'php'
        };
    }

    static isSupported(type) {
        return this.SUPPORTED_TYPES.includes((type || '').toLowerCase());
    }
}
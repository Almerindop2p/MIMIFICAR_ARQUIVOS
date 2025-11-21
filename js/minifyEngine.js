/**
 * Algoritmo central de minificação.
 * Responsável por tratar entrada de texto, arquivos individuais e arquivos ZIP,
 * delegando para os minificadores específicos e padronizando mensagens de erro.
 *
 * Exemplo (texto colado):
 * const resultado = MinifyEngine.minifyTextSnippet('const x = 1 + 2;', defaultOptions);
 *
 * Exemplo (ZIP):
 * const { blob, summary } = await MinifyEngine.minifyZipArchive(fileInput.files[0], defaultOptions, {
 *     onProgress: ({ current, total, file }) => console.log(`Processando ${current}/${total}: ${file}`)
 * });
 */
class MinifyError extends Error {
    constructor(code, message, meta = {}) {
        super(message);
        this.name = 'MinifyError';
        this.code = code;
        this.meta = meta;
    }
}

class MinifyEngine {
    static MIME_TYPE_MAP = {
        'text/html': 'html',
        'application/xhtml+xml': 'html',
        'text/css': 'css',
        'text/javascript': 'js',
        'application/javascript': 'js',
        'application/x-javascript': 'js',
        'application/json': 'json',
        'text/json': 'json',
        'application/x-httpd-php': 'php',
        'application/php': 'php',
        'text/x-php': 'php',
        'text/php': 'php'
    };

    static detectInputType({ content = '', fileName = '', mimeType = '' } = {}) {
        const normalizedMime = (mimeType || '').split(';')[0].toLowerCase();
        if (normalizedMime && this.MIME_TYPE_MAP[normalizedMime]) {
            return this.MIME_TYPE_MAP[normalizedMime];
        }

        if (fileName) {
            const extension = ClientMinifier.getExtension(fileName);
            const extensionMap = ClientMinifier.getExtensionMap();
            if (extension && extensionMap[extension]) {
                return extensionMap[extension];
            }
        }

        if (typeof content === 'string' && content.trim()) {
            return ClientMinifier.detectLanguage(content, fileName);
        }

        return 'text';
    }

    static ensureSupported(type) {
        if (!ClientMinifier.isSupported(type)) {
            throw new MinifyError(
                'UNSUPPORTED_TYPE',
                `Tipo não suportado para minificação: ${type || 'desconhecido'}.`
            );
        }
    }

    static minifyTextSnippet(rawContent, options = {}) {
        if (typeof rawContent !== 'string') {
            throw new MinifyError('INVALID_TEXT', 'Conteúdo inválido. Informe um texto em formato string.');
        }

        const content = rawContent.trim();
        if (!content) {
            throw new MinifyError('EMPTY_TEXT', 'Não há conteúdo para minificar.');
        }

        const detectedType = this.detectInputType({ content });
        this.ensureSupported(detectedType);

        const minified = ClientMinifier.minifyCode(content, detectedType, options);
        return {
            type: detectedType,
            original: rawContent,
            minified
        };
    }

    static async minifyZipArchive(file, options = {}, hooks = {}) {
        if (!(file instanceof Blob)) {
            throw new MinifyError('ZIP_INVALID', 'Arquivo inválido. Selecione um ZIP válido.');
        }

        if (file.size === 0) {
            throw new MinifyError('ZIP_EMPTY', 'O arquivo ZIP está vazio.');
        }

        let zip;
        try {
            zip = await JSZip.loadAsync(file);
        } catch (error) {
            throw new MinifyError('ZIP_PARSE_ERROR', 'Não foi possível ler o ZIP fornecido.', { originalError: error });
        }

        const outputZip = new JSZip();
        const entries = [];
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                entries.push({ relativePath, zipEntry });
            }
        });

        const summary = {
            total: entries.length,
            minified: 0,
            copied: 0,
            skipped: 0,
            errors: []
        };

        for (let index = 0; index < entries.length; index++) {
            const { relativePath, zipEntry } = entries[index];
            const typeHint = this.detectInputType({
                fileName: relativePath,
                mimeType: this.getMimeFromExtension(relativePath)
            });
            const shouldAttempt = ClientMinifier.isSupported(typeHint);

            if (shouldAttempt) {
                try {
                    const content = await zipEntry.async('string');

                    if (!content.trim()) {
                        outputZip.file(relativePath, content);
                        summary.copied += 1;
                    } else {
                        const detectedType = this.detectInputType({
                            content,
                            fileName: relativePath
                        });
                        this.ensureSupported(detectedType);

                        const minified = ClientMinifier.minifyCode(content, detectedType, options);
                        outputZip.file(relativePath, minified);
                        summary.minified += 1;
                    }
                } catch (error) {
                    summary.errors.push({ file: relativePath, error: error.message });
                    const fallbackData = await zipEntry.async('uint8array');
                    outputZip.file(relativePath, fallbackData);
                    summary.copied += 1;
                }
            } else {
                const binaryData = await zipEntry.async('uint8array');
                outputZip.file(relativePath, binaryData, { binary: true });
                summary.skipped += 1;
            }

            hooks.onProgress?.({
                current: index + 1,
                total: summary.total,
                file: relativePath,
                summary
            });
        }

        const blob = await outputZip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return { blob, summary };
    }

    static getMimeFromExtension(fileName = '') {
        const extension = ClientMinifier.getExtension(fileName);
        const extensionToMime = {
            html: 'text/html',
            htm: 'text/html',
            css: 'text/css',
            js: 'application/javascript',
            mjs: 'application/javascript',
            cjs: 'application/javascript',
            json: 'application/json',
            php: 'text/x-php',
            phtml: 'text/x-php'
        };
        return extension ? extensionToMime[extension] || '' : '';
    }

    static formatError(error) {
        if (error instanceof MinifyError) {
            return error.message;
        }

        return 'Erro inesperado. Verifique o console para mais detalhes.';
    }
}

// Disponibiliza no escopo global do navegador
window.MinifyEngine = MinifyEngine;

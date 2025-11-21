class MinificationApp {
    constructor() {
        this.currentFile = null;
        this.lastResult = null;
        this.selectedZipFile = null;
        this.MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100 MB

        this.initializeElements();
        this.bindEvents();
        this.handleCodeInputChange();
        this.updateZipStatus('Nenhum arquivo ZIP selecionado.');
        this.toggleResultArea(false);
    }

    initializeElements() {
        // Código colado
        this.codeInput = document.getElementById('codeInput');
        this.detectedLanguageLabel = document.getElementById('detectedLanguage');
        this.clearCodeBtn = document.getElementById('clearCodeBtn');
        this.minifyCodeBtn = document.getElementById('minifyCodeBtn');

        // Upload individual
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.fileName = document.getElementById('fileName');
        this.fileType = document.getElementById('fileType');
        this.minifyBtn = document.getElementById('minifyBtn');

        // Opções
        this.removeComments = document.getElementById('removeComments');
        this.removeSpaces = document.getElementById('removeSpaces');
        this.removeLineBreaks = document.getElementById('removeLineBreaks');

        // ZIP
        this.zipDropArea = document.getElementById('zipDropArea');
        this.zipInput = document.getElementById('zipInput');
        this.selectZipBtn = document.getElementById('selectZipBtn');
        this.processZipBtn = document.getElementById('processZipBtn');
        this.zipStatus = document.getElementById('zipStatus');

        // Resultado
        this.resultArea = document.getElementById('resultArea');
        this.resultMeta = document.getElementById('resultMeta');
        this.originalSize = document.getElementById('originalSize');
        this.minifiedSize = document.getElementById('minifiedSize');
        this.reduction = document.getElementById('reduction');
        this.minifiedCodeElement = document.getElementById('minifiedCode');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');

        // Loading
        this.loading = document.getElementById('loading');
        this.loadingMessage = document.getElementById('loadingMessage');
    }

    bindEvents() {
        // Código colado
        this.codeInput.addEventListener('input', () => this.handleCodeInputChange());
        this.clearCodeBtn.addEventListener('click', () => this.clearCodeInput());
        this.minifyCodeBtn.addEventListener('click', () => this.handleCodeMinify());

        // Arquivo individual
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (event) => this.handleFileSelect(event));
        this.uploadArea.addEventListener('dragover', (event) => this.handleDragOver(event, this.uploadArea));
        this.uploadArea.addEventListener('dragleave', (event) => this.handleDragLeave(event, this.uploadArea));
        this.uploadArea.addEventListener('drop', (event) => this.handleFileDrop(event));
        this.minifyBtn.addEventListener('click', () => this.minifyCurrentFile());

        // Resultado
        this.downloadBtn.addEventListener('click', () => this.downloadFile());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        // ZIP
        this.selectZipBtn.addEventListener('click', () => this.zipInput.click());
        this.zipInput.addEventListener('change', (event) => this.handleZipSelect(event));
        this.zipDropArea.addEventListener('dragover', (event) => this.handleDragOver(event, this.zipDropArea));
        this.zipDropArea.addEventListener('dragleave', (event) => this.handleDragLeave(event, this.zipDropArea));
        this.zipDropArea.addEventListener('drop', (event) => this.handleZipDrop(event));
        this.processZipBtn.addEventListener('click', () => this.processZip());
    }

    // ---- Código colado ----
    handleCodeInputChange() {
        const content = this.codeInput.value;
        const hasContent = content.trim().length > 0;
        this.minifyCodeBtn.disabled = !hasContent;

        const detected = hasContent
            ? MinifyEngine.detectInputType({ content })
            : 'text';
        this.updateLanguageLabel(detected);
    }

    clearCodeInput() {
        this.codeInput.value = '';
        this.minifyCodeBtn.disabled = true;
        this.updateLanguageLabel('text');
    }

    handleCodeMinify() {
        const content = this.codeInput.value;
        if (!content.trim()) {
            this.handleError(new MinifyError('EMPTY_TEXT', 'Cole algum código para minificar.'));
            return;
        }

        this.minifyContent({
            content,
            fileName: null,
            origin: 'input'
        });
    }

    updateLanguageLabel(type) {
        const labels = {
            html: 'HTML',
            css: 'CSS',
            js: 'JavaScript',
            json: 'JSON',
            php: 'PHP',
            text: 'Não identificado'
        };
        this.detectedLanguageLabel.textContent = labels[type] || labels.text;
    }

    // ---- Upload individual ----
    handleDragOver(event, area) {
        event.preventDefault();
        area.classList.add('dragover');
    }

    handleDragLeave(event, area) {
        event.preventDefault();
        area.classList.remove('dragover');
    }

    handleFileDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const file = event.dataTransfer.files?.[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const detectedType = MinifyEngine.detectInputType({
                content,
                fileName: file.name,
                mimeType: file.type
            });

            this.currentFile = {
                name: file.name,
                content,
                type: detectedType,
                mime: file.type
            };

            this.fileName.textContent = file.name;
            this.fileType.textContent = this.getTypeLabel(detectedType);

            const supported = ClientMinifier.isSupported(detectedType);
            this.minifyBtn.disabled = !supported;

            if (!supported) {
                this.handleError(new MinifyError('UNSUPPORTED_TYPE', 'Tipo de arquivo não suportado para minificação automática.'));
            }
        };

        reader.onerror = () => {
            this.handleError(new MinifyError('FILE_READ_ERROR', 'Não foi possível ler o arquivo selecionado.'));
        };

        reader.readAsText(file);
        this.fileInput.value = '';
    }

    minifyCurrentFile() {
        if (!this.currentFile) {
            this.handleError(new MinifyError('NO_FILE_SELECTED', 'Selecione um arquivo antes de minificar.'));
            return;
        }

        if (!ClientMinifier.isSupported(this.currentFile.type)) {
            this.handleError(new MinifyError('UNSUPPORTED_TYPE', 'Tipo de arquivo não suportado.'));
            return;
        }

        this.minifyContent({
            content: this.currentFile.content,
            fileName: this.currentFile.name,
            origin: 'file'
        });
    }

    // ---- Minificação comum ----
    minifyContent({ content, fileName, origin }) {
        this.showLoading(true, 'Minificando...');

        setTimeout(() => {
            try {
                const options = this.getOptions();
                const result = MinifyEngine.minifyTextSnippet(content, options);

                const resolvedName = fileName || `codigo-digitado.${result.type}`;
                this.lastResult = {
                    fileName: resolvedName,
                    type: result.type,
                    original: result.original,
                    minified: result.minified,
                    origin
                };

                this.renderResult();
            } catch (error) {
                this.handleError(error);
            } finally {
                this.showLoading(false);
            }
        }, 150);
    }

    renderResult() {
        if (!this.lastResult) return;

        const { fileName, type, original, minified } = this.lastResult;
        const originalSize = new Blob([original]).size;
        const minifiedSize = new Blob([minified]).size;
        const reduction = originalSize === 0 ? 0 : ((originalSize - minifiedSize) / originalSize * 100);

        this.resultMeta.textContent = `${fileName} • ${this.getTypeLabel(type)}`;
        this.originalSize.textContent = `Original: ${this.formatBytes(originalSize)}`;
        this.minifiedSize.textContent = `Minificado: ${this.formatBytes(minifiedSize)}`;
        this.reduction.textContent = `(${reduction.toFixed(1)}% menor)`;
        this.minifiedCodeElement.textContent = minified;

        this.downloadBtn.style.display = 'inline-block';
        this.copyBtn.style.display = 'inline-block';

        this.toggleResultArea(true);
        this.resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    toggleResultArea(show) {
        if (!this.resultArea) return;
        this.resultArea.style.display = show ? 'block' : 'none';
    }

    getOptions() {
        return {
            removeComments: this.removeComments.checked,
            removeSpaces: this.removeSpaces.checked,
            removeLineBreaks: this.removeLineBreaks.checked
        };
    }

    formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    getTypeLabel(type) {
        const labels = {
            html: 'HTML',
            css: 'CSS',
            js: 'JavaScript',
            json: 'JSON',
            php: 'PHP',
            text: 'Texto'
        };
        return labels[type] || 'Desconhecido';
    }

    downloadFile() {
        if (!this.lastResult) return;

        const extension = ClientMinifier.getExtension(this.lastResult.fileName) || this.lastResult.type || 'txt';
        const safeExtension = extension || 'txt';
        const baseWithoutExt = this.lastResult.fileName.replace(/\.[^/.]+$/, '');
        const alreadyMinified = baseWithoutExt.toLowerCase().endsWith('.min');
        const finalBase = alreadyMinified ? baseWithoutExt : `${baseWithoutExt}.min`;
        const fileName = `${finalBase}.${safeExtension}`;
        const blob = new Blob([this.lastResult.minified], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    copyToClipboard() {
        if (!this.lastResult) return;

        navigator.clipboard.writeText(this.lastResult.minified)
            .then(() => {
                const originalText = this.copyBtn.textContent;
                this.copyBtn.textContent = 'Copiado!';
                this.copyBtn.style.background = '#27ae60';

                setTimeout(() => {
                    this.copyBtn.textContent = originalText;
                    this.copyBtn.style.background = '';
                }, 2000);
            })
            .catch((error) => {
                console.error('Erro ao copiar para a área de transferência:', error);
                alert('Não foi possível copiar o código.');
            });
    }

    // ---- ZIP ----
    handleZipSelect(event) {
        const file = event.target.files?.[0];
        if (file) {
            this.prepareZip(file);
        }
    }

    handleZipDrop(event) {
        event.preventDefault();
        this.zipDropArea.classList.remove('dragover');
        const file = event.dataTransfer.files?.[0];
        if (file) {
            this.prepareZip(file);
        }
    }

    prepareZip(file) {
        if (file.size > this.MAX_ZIP_SIZE) {
            this.handleError(new MinifyError('ZIP_TOO_LARGE', 'O arquivo ZIP deve ter no máximo 100 MB.'));
            this.zipInput.value = '';
            this.processZipBtn.disabled = true;
            this.selectedZipFile = null;
            this.updateZipStatus('Nenhum arquivo ZIP selecionado.');
            return;
        }

        this.selectedZipFile = file;
        this.processZipBtn.disabled = false;
        this.updateZipStatus(`Selecionado: ${file.name} (${this.formatBytes(file.size)})`);
        this.zipInput.value = '';
    }

    async processZip() {
        if (!this.selectedZipFile) {
            this.handleError(new MinifyError('ZIP_NOT_SELECTED', 'Selecione um arquivo ZIP primeiro.'));
            return;
        }

        if (typeof JSZip === 'undefined') {
            this.handleError(new MinifyError('JSZIP_MISSING', 'Biblioteca JSZip não carregada.'));
            return;
        }

        this.showLoading(true, 'Processando ZIP...');

        try {
            const { blob, summary } = await MinifyEngine.minifyZipArchive(this.selectedZipFile, this.getOptions(), {
                onProgress: ({ current, total, file }) => {
                    this.updateZipStatus(`Processando ZIP: ${current}/${total} • ${file}`);
                }
            });
            this.triggerZipDownload(blob, this.selectedZipFile.name);

            const summaryMessage = `ZIP pronto! ${summary.minified} arquivo(s) minificado(s), ${summary.skipped} mantido(s), ${summary.errors.length} erro(s).`;
            this.updateZipStatus(summaryMessage);
            this.selectedZipFile = null;
            this.processZipBtn.disabled = true;
        } catch (error) {
            this.handleError(error);
        } finally {
            this.showLoading(false);
        }
    }

    triggerZipDownload(blob, originalName) {
        const baseName = originalName.replace(/\.zip$/i, '') || 'projeto-minificado';
        const fileName = `${baseName}-minificado.zip`;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    updateZipStatus(message) {
        if (this.zipStatus) {
            this.zipStatus.textContent = message;
        }
    }

    // ---- Utilidades ----
    showLoading(show, message = 'Processando...') {
        if (!this.loading) return;
        this.loading.style.display = show ? 'flex' : 'none';
        if (this.loadingMessage) {
            this.loadingMessage.textContent = message;
        }
    }

    handleError(error) {
        const message = MinifyEngine.formatError(error);
        alert(message);
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MinificationApp();
});
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

        if (!hasContent) {
            this.updateLanguageLabel('text');
            return;
        }

        const detected = ClientMinifier.detectLanguage(content);
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
            alert('Cole algum código para minificar.');
            return;
        }

        const detectedType = ClientMinifier.detectLanguage(content);
        if (!ClientMinifier.isSupported(detectedType)) {
            alert('Não foi possível detectar um tipo suportado para este código.');
            return;
        }

        const fileName = `codigo-digitado.${detectedType}`;
        this.minifyContent({
            content,
            fileName,
            detectedType,
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
        reader.onload = (e) => {
            const content = e.target.result;
            const detectedType = ClientMinifier.detectLanguage(content, file.name);

            this.currentFile = {
                name: file.name,
                content,
                type: detectedType
            };

            this.fileName.textContent = file.name;
            this.fileType.textContent = this.getTypeLabel(detectedType);
            this.minifyBtn.disabled = !ClientMinifier.isSupported(detectedType);

            if (!ClientMinifier.isSupported(detectedType)) {
                alert('Tipo de arquivo não suportado para minificação automática.');
            }
        };

        reader.onerror = () => {
            alert('Não foi possível ler o arquivo selecionado.');
        };

        reader.readAsText(file);
        this.fileInput.value = '';
    }

    minifyCurrentFile() {
        if (!this.currentFile) {
            alert('Selecione um arquivo antes de minificar.');
            return;
        }

        if (!ClientMinifier.isSupported(this.currentFile.type)) {
            alert('Tipo de arquivo não suportado.');
            return;
        }

        this.minifyContent({
            content: this.currentFile.content,
            fileName: this.currentFile.name,
            detectedType: this.currentFile.type,
            origin: 'file'
        });
    }

    // ---- Minificação comum ----
    minifyContent({ content, fileName, detectedType, origin }) {
        this.showLoading(true, 'Minificando...');

        setTimeout(() => {
            try {
                const options = this.getOptions();
                const minified = ClientMinifier.minifyCode(content, detectedType, options);

                this.lastResult = {
                    fileName,
                    type: detectedType,
                    original: content,
                    minified,
                    origin
                };

                this.renderResult();
            } catch (error) {
                console.error('Erro ao minificar conteúdo:', error);
                alert('Erro ao minificar conteúdo. Verifique o console para mais detalhes.');
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
            alert('O arquivo ZIP deve ter no máximo 100 MB.');
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
            alert('Selecione um arquivo ZIP primeiro.');
            return;
        }

        if (typeof JSZip === 'undefined') {
            alert('Biblioteca JSZip não carregada.');
            return;
        }

        this.showLoading(true, 'Processando ZIP...');

        try {
            const { blob, summary } = await this.minifyZipFile(this.selectedZipFile);
            this.triggerZipDownload(blob, this.selectedZipFile.name);
            this.updateZipStatus(`ZIP pronto! ${summary.minified}/${summary.totalText} arquivos de texto minificados.`);
            this.selectedZipFile = null;
            this.processZipBtn.disabled = true;
        } catch (error) {
            console.error('Erro ao processar ZIP:', error);
            alert('Erro ao processar o arquivo ZIP.');
        } finally {
            this.showLoading(false);
        }
    }

    async minifyZipFile(file) {
        const originalZip = await JSZip.loadAsync(file);
        const newZip = new JSZip();
        const entries = [];

        originalZip.forEach((relativePath, zipEntry) => {
            if (zipEntry.dir) return;
            entries.push({ relativePath, zipEntry });
        });

        const summary = {
            total: entries.length,
            totalText: 0,
            minified: 0
        };

        const options = this.getOptions();
        let processed = 0;

        for (const { relativePath, zipEntry } of entries) {
            const typeFromExtension = ClientMinifier.detectLanguage('', relativePath);
            const shouldMinify = ClientMinifier.isSupported(typeFromExtension);

            if (shouldMinify) {
                summary.totalText += 1;
                try {
                    const content = await zipEntry.async('string');
                    const detectedType = ClientMinifier.detectLanguage(content, relativePath);
                    if (ClientMinifier.isSupported(detectedType)) {
                        const minified = ClientMinifier.minifyCode(content, detectedType, options);
                        newZip.file(relativePath, minified);
                        summary.minified += 1;
                    } else {
                        newZip.file(relativePath, content);
                    }
                } catch (error) {
                    console.warn(`Falha ao minificar ${relativePath}. Copiando original.`, error);
                    const originalData = await zipEntry.async('uint8array');
                    newZip.file(relativePath, originalData);
                }
            } else {
                const binaryData = await zipEntry.async('uint8array');
                newZip.file(relativePath, binaryData);
            }

            processed += 1;
            this.updateZipStatus(`Processando ZIP: ${processed}/${summary.total} arquivos...`);
        }

        const blob = await newZip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return { blob, summary };
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
}

document.addEventListener('DOMContentLoaded', () => {
    new MinificationApp();
});
class MinificationApp {
    constructor() {
        this.currentFile = null;
        this.minifiedResult = '';
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.optionsPanel = document.getElementById('optionsPanel');
        this.resultArea = document.getElementById('resultArea');
        this.loading = document.getElementById('loading');

        // Info elements
        this.fileName = document.getElementById('fileName');
        this.fileType = document.getElementById('fileType');

        // Options
        this.removeComments = document.getElementById('removeComments');
        this.removeSpaces = document.getElementById('removeSpaces');
        this.removeLineBreaks = document.getElementById('removeLineBreaks');

        // Buttons
        this.minifyBtn = document.getElementById('minifyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');

        // Result elements
        this.originalSize = document.getElementById('originalSize');
        this.minifiedSize = document.getElementById('minifiedSize');
        this.reduction = document.getElementById('reduction');
        this.minifiedCodeElement = document.getElementById('minifiedCode');
    }

    bindEvents() {
        // Upload events
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Action buttons
        this.minifyBtn.addEventListener('click', () => this.minifyFile());
        this.downloadBtn.addEventListener('click', () => this.downloadFile());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!['html', 'htm', 'css', 'js'].includes(fileExtension)) {
            alert('Por favor, selecione um arquivo HTML, CSS ou JavaScript.');
            return;
        }

        this.currentFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentFile.content = e.target.result;
            this.showFileInfo();
        };
        reader.readAsText(file);
    }

    showFileInfo() {
        const fileExtension = this.currentFile.name.split('.').pop().toLowerCase();
        let fileType = '';

        switch (fileExtension) {
            case 'html':
            case 'htm':
                fileType = 'HTML';
                break;
            case 'css':
                fileType = 'CSS';
                break;
            case 'js':
                fileType = 'JavaScript';
                break;
        }

        this.fileName.textContent = this.currentFile.name;
        this.fileType.textContent = fileType;

        this.optionsPanel.style.display = 'block';
        this.resultArea.style.display = 'none';

        // Scroll to options
        this.optionsPanel.scrollIntoView({ behavior: 'smooth' });
    }

    async minifyFile() {
        if (!this.currentFile) return;

        this.showLoading(true);

        try {
            // Pequeno delay para mostrar o loading
            await new Promise(resolve => setTimeout(resolve, 500));

            const options = {
                removeComments: this.removeComments.checked,
                removeSpaces: this.removeSpaces.checked,
                removeLineBreaks: this.removeLineBreaks.checked
            };

            const fileExtension = this.currentFile.name.split('.').pop().toLowerCase();
            let fileType = '';

            switch (fileExtension) {
                case 'html':
                case 'htm':
                    fileType = 'html';
                    break;
                case 'css':
                    fileType = 'css';
                    break;
                case 'js':
                    fileType = 'js';
                    break;
            }

            const payload = {
                content: this.currentFile.content,
                fileName: this.currentFile.name,
                fileType,
                options,
                createdAt: Date.now()
            };

            sessionStorage.setItem('minifyTask', JSON.stringify(payload));
            window.location.href = 'result.html';

        } catch (error) {
            console.error('Erro na minificacao:', error);
            alert('Erro ao minificar o arquivo. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    showResults() {
        if (!this.currentFile || !this.minifiedResult) return;

        const originalSize = new Blob([this.currentFile.content]).size;
        const minifiedSize = new Blob([this.minifiedResult]).size;
        const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

        this.originalSize.textContent = `Original: ${this.formatBytes(originalSize)}`;
        this.minifiedSize.textContent = `Minificado: ${this.formatBytes(minifiedSize)}`;
        this.reduction.textContent = `(${reduction}% menor)`;

        this.minifiedCodeElement.textContent = this.minifiedResult;

        this.resultArea.style.display = 'block';
        this.downloadBtn.style.display = 'inline-block';
        this.copyBtn.style.display = 'inline-block';

        this.resultArea.scrollIntoView({ behavior: 'smooth' });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    downloadFile() {
        if (!this.minifiedResult || !this.currentFile) return;

        const fileExtension = this.currentFile.name.split('.').pop();
        const fileName = this.currentFile.name.replace(`.${fileExtension}`, `.min.${fileExtension}`);

        const blob = new Blob([this.minifiedResult], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copyToClipboard() {
        if (!this.minifiedResult) return;

        navigator.clipboard.writeText(this.minifiedResult).then(() => {
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copiado!';
            this.copyBtn.style.background = '#27ae60';

            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            alert('Erro ao copiar para a area de transferencia.');
        });
    }

    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
    }
}

// Inicializa a aplicacao quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
        new MinificationApp();
});


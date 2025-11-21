class ResultPage {
    constructor() {
        this.loading = document.getElementById('loading');
        this.resultArea = document.getElementById('resultArea');
        this.fallbackMessage = document.getElementById('fallbackMessage');

        this.fileName = document.getElementById('fileName');
        this.fileType = document.getElementById('fileType');
        this.originalSize = document.getElementById('originalSize');
        this.minifiedSize = document.getElementById('minifiedSize');
        this.reduction = document.getElementById('reduction');
        this.minifiedCodeElement = document.getElementById('minifiedCode');

        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');

        this.minifiedResult = '';
        this.payload = null;

        this.bindEvents();
        this.loadTask();
    }

    bindEvents() {
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadFile());
        }
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        }
    }

    loadTask() {
        const raw = sessionStorage.getItem('minifyTask');

        if (!raw) {
            this.showFallback('Nenhum arquivo foi enviado para minificacao.');
            return;
        }

        try {
            this.payload = JSON.parse(raw);
        } catch (error) {
            console.error('Erro ao ler dados da minificacao:', error);
            this.showFallback('Nao foi possivel recuperar os dados.');
            return;
        }

        sessionStorage.removeItem('minifyTask');
        this.populateInfo();
        this.startMinify();
    }

    populateInfo() {
        if (this.fileName) this.fileName.textContent = this.payload.fileName || 'Arquivo';

        let label = '';
        switch (this.payload.fileType) {
            case 'html':
                label = 'HTML';
                break;
            case 'css':
                label = 'CSS';
                break;
            case 'js':
                label = 'JavaScript';
                break;
            default:
                label = 'Arquivo';
        }
        if (this.fileType) this.fileType.textContent = label;
    }

    async startMinify() {
        this.toggleLoading(true);

        // Pequeno atraso para exibir o loading em navegadores muito rapidos
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            this.minifiedResult = ClientMinifier.minifyCode(
                this.payload.content,
                this.payload.fileType,
                this.payload.options
            );
            this.showResults();
        } catch (error) {
            console.error('Erro na minificacao:', error);
            this.showFallback('Erro ao minificar o arquivo. Tente novamente.');
        } finally {
            this.toggleLoading(false);
        }
    }

    showResults() {
        if (!this.payload || !this.minifiedResult) {
            this.showFallback('Nenhum resultado para exibir.');
            return;
        }

        const originalSize = new Blob([this.payload.content]).size;
        const minifiedSize = new Blob([this.minifiedResult]).size;
        const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

        if (this.originalSize) this.originalSize.textContent = `Original: ${this.formatBytes(originalSize)}`;
        if (this.minifiedSize) this.minifiedSize.textContent = `Minificado: ${this.formatBytes(minifiedSize)}`;
        if (this.reduction) this.reduction.textContent = `(${reduction}% menor)`;
        if (this.minifiedCodeElement) this.minifiedCodeElement.textContent = this.minifiedResult;

        if (this.downloadBtn) this.downloadBtn.style.display = 'inline-block';
        if (this.copyBtn) this.copyBtn.style.display = 'inline-block';

        if (this.resultArea) this.resultArea.style.display = 'block';
    }

    downloadFile() {
        if (!this.minifiedResult || !this.payload) return;

        const fileExtension = this.payload.fileName.split('.').pop();
        const fileName = this.payload.fileName.replace(`.${fileExtension}`, `.min.${fileExtension}`);

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

    toggleLoading(show) {
        if (this.loading) this.loading.style.display = show ? 'flex' : 'none';
        if (!show && this.resultArea) {
            this.resultArea.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showFallback(message) {
        if (this.loading) this.loading.style.display = 'none';
        if (this.resultArea) this.resultArea.style.display = 'none';
        if (this.fallbackMessage) {
            this.fallbackMessage.style.display = 'block';
            const paragraphs = this.fallbackMessage.getElementsByTagName('p');
            if (paragraphs.length > 0) paragraphs[0].textContent = message;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ResultPage();
});

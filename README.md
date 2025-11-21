# Minificador 100% Client-Side

Aplicação web para minificar HTML, CSS, JS, JSON e PHP diretamente no navegador, sem depender de processamento no backend. O usuário pode colar código manualmente, enviar um arquivo único ou subir um ZIP completo. Toda a lógica roda no cliente via JavaScript + JSZip.

## Funcionalidades
- **Entrada manual de código:** detecção automática do tipo por conteúdo, minificação instantânea e possibilidade de download/cópia.
- **Upload individual:** arraste e solte um arquivo para receber o resultado minificado com estatísticas de redução.
- **Upload de ZIP (até 100 MB):** o ZIP é lido no navegador, cada arquivo suportado é minificado e um novo ZIP com a mesma estrutura é gerado para download.
- **Tratamento de erros:** mensagens claras para ZIP inválido, arquivos vazios, tipos não suportados ou conteúdo inconsistente.
- **Arquitetura modular:** `ClientMinifier` cuida dos minificadores específicos e `MinifyEngine` organiza leitura, detecção e fluxo de minificação.

## Estrutura
```
workspace/
├── index.html          # Hub principal com menu
├── paste.html          # Fluxo “Colar código”
├── file.html           # Fluxo “Minificar arquivo”
├── zip.html            # Fluxo “Minificar ZIP”
├── css/style.css       # Estilos
├── js/minifiers.js     # Minificadores para cada tipo
├── js/minifyEngine.js  # Orquestrador (texto + ZIP)
├── js/app.js           # Lógica da interface
└── result.html         # Página legada de resultado (opcional)
```

## Como usar (interface)
### Colar código
1. Acesse `paste.html` (ou clique em “Colar código” no menu).
2. Cole o conteúdo no textarea principal.
3. Verifique o tipo detectado automaticamente (HTML, CSS, JS, JSON ou PHP).
4. Ajuste as opções desejadas, clique em **Minificar Código** e copie ou baixe o resultado.

### Minificar arquivo único
1. Acesse `file.html`.
2. Envie ou arraste o arquivo suportado.
3. Ajuste as opções e clique em **Minificar Arquivo** para visualizar e baixar a versão otimizada.

### Minificar ZIP
1. Acesse `zip.html`.
2. Envie o ZIP (até 100 MB) com pastas e arquivos suportados.
3. Aguarde o processamento (progresso exibido em tempo real).
4. O novo ZIP minificado é baixado automaticamente ao final.

## Exemplos programáticos
Mesmo que a aplicação rode no navegador, o módulo `MinifyEngine` pode ser reutilizado em outras páginas:

```js
// Minificar um snippet direto
const options = { removeComments: true, removeSpaces: true, removeLineBreaks: true };
const { type, minified } = MinifyEngine.minifyTextSnippet('<h1> Teste </h1>', options);
console.log(type);      // "html"
console.log(minified);  // "<h1>Teste</h1>"
```

```js
// Minificar um ZIP (ex.: dentro de um listener de input[type=file])
const file = fileInput.files[0];
const { blob, summary } = await MinifyEngine.minifyZipArchive(file, options, {
    onProgress: ({ current, total, file }) => console.log(`${current}/${total} • ${file}`)
});
console.log(summary);  // estatísticas do processamento
// fazer download manual:
const url = URL.createObjectURL(blob);
```

## Observações
- O backend existente (`server/`) permanece apenas para compatibilidade, mas não é necessário para o novo fluxo.
- Minificação de PHP é cuidadosa: remove comentários/espaços básicos sem afetar strings.
- JSON só é minificado quando válido; caso contrário, o arquivo original é preservado dentro do ZIP.*** End Patch

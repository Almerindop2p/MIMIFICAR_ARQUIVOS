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
├── index.html          # UI principal
├── css/style.css       # Estilos
├── js/minifiers.js     # Minificadores para cada tipo
├── js/minifyEngine.js  # Orquestrador (texto + ZIP)
├── js/app.js           # Lógica da interface
└── result.html         # Página legada de resultado (opcional)
```

## Como usar (interface)
### Colar código
1. Acesse `index.html`.
2. Cole o conteúdo no painel “Colar código”.
3. Confirme o tipo detectado automaticamente (ex.: HTML, JSON).
4. Clique em **Minificar Código** e copie ou faça download do resultado.

### Enviar um ZIP
1. Clique em “Selecionar ZIP” (ou arraste o arquivo).
2. Aguarde o processamento; o progresso aparece no painel.
3. O download do novo ZIP minificado inicia automaticamente ao final.

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

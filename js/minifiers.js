// Minificadores no lado do cliente
class ClientMinifier {
    static minifyHTML(code, options = {}) {
        let minified = code;
        
        if (options.removeComments) {
            minified = minified.replace(/<!--[\s\S]*?-->/g, '');
        }
        
        if (options.removeSpaces) {
            minified = minified.replace(/\s+/g, ' ');
            minified = minified.replace(/>\s+</g, '><');
        }
        
        if (options.removeLineBreaks) {
            minified = minified.replace(/\n/g, '');
            minified = minified.replace(/\r/g, '');
            minified = minified.replace(/\t/g, ' ');
        }
        
        return minified.trim();
    }

    static minifyCSS(code, options = {}) {
        let minified = code;
        
        if (options.removeComments) {
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
        }
        
        if (options.removeSpaces) {
            minified = minified.replace(/\s+/g, ' ');
            minified = minified.replace(/\s*{\s*/g, '{');
            minified = minified.replace(/\s*}\s*/g, '}');
            minified = minified.replace(/\s*;\s*/g, ';');
            minified = minified.replace(/\s*:\s*/g, ':');
            minified = minified.replace(/\s*,\s*/g, ',');
        }
        
        if (options.removeLineBreaks) {
            minified = minified.replace(/\n/g, '');
            minified = minified.replace(/\r/g, '');
            minified = minified.replace(/\t/g, '');
        }
        
        return minified.trim();
    }

    static minifyJS(code, options = {}) {
        let minified = code;
        
        if (options.removeComments) {
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
            minified = minified.replace(/\/\/.*$/gm, '');
        }
        
        if (options.removeSpaces) {
            // Preserva espaços em strings
            minified = minified.replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, (match) => {
                return match.replace(/ /g, '␣');
            });
            
            minified = minified.replace(/\s+/g, ' ');
            minified = minified.replace(/\s*([=+\-*\/%&|^!<>?{}();:,])\s*/g, '$1');
            
            // Restaura espaços em strings
            minified = minified.replace(/␣/g, ' ');
        }
        
        if (options.removeLineBreaks) {
            minified = minified.replace(/\n/g, ' ');
            minified = minified.replace(/\r/g, ' ');
            minified = minified.replace(/\t/g, ' ');
        }
        
        return minified.trim();
    }

    static minifyCode(code, fileType, options) {
        switch (fileType) {
            case 'html':
                return this.minifyHTML(code, options);
            case 'css':
                return this.minifyCSS(code, options);
            case 'js':
                return this.minifyJS(code, options);
            default:
                return code;
        }
    }
}
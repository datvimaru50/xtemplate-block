import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
export class XTemplateDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];
        const stack: { symbol: vscode.DocumentSymbol; path: string[] }[] = [];

        for (let line = 0; line < document.lineCount; line++) {
            const text = document.lineAt(line).text;

            // Check for BEGIN block
            const beginMatch = text.match(/<!--\s*BEGIN:\s*(\w+)\s*-->/);
            if (beginMatch) {
                const name = beginMatch[1];
                const symbol = new vscode.DocumentSymbol(
                    name,
                    '',
                    vscode.SymbolKind.Namespace,
                    new vscode.Range(line, 0, line, text.length),
                    new vscode.Range(line, 0, line, text.length)
                );

                const currentPath = stack.length > 0 ? [...stack[stack.length - 1].path, name] : [name];
                symbol.detail = currentPath.join('.'); // Add detail as the path from root to current block

                if (stack.length > 0) {
                    stack[stack.length - 1].symbol.children.push(symbol);
                } else {
                    symbols.push(symbol);
                }

                stack.push({ symbol, path: currentPath });
            }

            // Check for END block
            const endMatch = text.match(/<!--\s*END:\s*(\w+)\s*-->/);
            if (endMatch) {
                const name = endMatch[1];
                if (stack.length > 0 && stack[stack.length - 1].symbol.name === name) {
                    const { symbol } = stack.pop()!;
                    symbol.range = new vscode.Range(
                        symbol.range.start,
                        new vscode.Position(line, text.length)
                    );
                    symbol.selectionRange = symbol.range;
                }
            }
        }

        return symbols;
    }
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
export class XTemplateDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    private foldingRanges: vscode.FoldingRange[] = [];

    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];
        const stack: { symbol: vscode.DocumentSymbol; path: string[]; startLine: number }[] = [];

        for (let line = 0; line < document.lineCount; line++) {
            const text = document.lineAt(line).text;

            // Check for BEGIN block (case-insensitive)
            const beginMatch = text.match(/<!--\s*BEGIN:\s*([\w\d_-]+)\s*-->/i);
            if (beginMatch) {
                const name = beginMatch[1];
                const symbol = new vscode.DocumentSymbol(
                    name,
                    '',
                    vscode.SymbolKind.Class, // Use 'Class' for a more distinct icon
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

                stack.push({ symbol, path: currentPath, startLine: line });
            }

            // Check for END block (case-insensitive)
            const endMatch = text.match(/<!--\s*END:\s*([\w\d_-]+)\s*-->/i);
            if (endMatch) {
                const name = endMatch[1];
                if (stack.length > 0 && stack[stack.length - 1].symbol.name.toLowerCase() === name.toLowerCase()) {
                    const { symbol, startLine } = stack.pop()!;
                    symbol.range = new vscode.Range(
                        symbol.range.start,
                        new vscode.Position(line, text.length)
                    );
                    symbol.selectionRange = symbol.range;

                    // Add folding range, excluding the END line from being hidden
                    this.foldingRanges.push({
                        start: startLine,
                        end: line - 1, // Exclude the END line
                    });
                }
            }
        }

        return symbols;
    }

    public provideFoldingRanges(): vscode.FoldingRange[] {
        return this.foldingRanges;
    }
}

export class XTemplateHoverProvider implements vscode.HoverProvider {
    constructor(private symbolProvider: XTemplateDocumentSymbolProvider) {}

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        const lineText = document.lineAt(position.line).text;

        // Check if the line contains BEGIN or END tags
        const isBeginOrEnd = /<!--\s*(BEGIN|END):\s*\w+\s*-->/.test(lineText);
        if (!isBeginOrEnd) {
            return null;
        }

        const symbols = await this.symbolProvider.provideDocumentSymbols(document, token);

        if (symbols) {
            for (const symbol of symbols) {
                const hoverResult = this.getHoverForSymbol(symbol, position);
                if (hoverResult) {
                    return hoverResult;
                }
            }
        }

        return null;
    }

    private getHoverForSymbol(symbol: vscode.DocumentSymbol, position: vscode.Position): vscode.Hover | null {
        if (this.isPositionInRange(position, symbol.range)) {
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`\`${symbol.detail}\``);
            markdown.appendMarkdown('\n\n---\n');
            markdown.appendMarkdown(`[Copy](command:xtemplate.copyToClipboard?${encodeURIComponent(JSON.stringify([symbol.detail]))} "Copy to Clipboard")`);
            markdown.isTrusted = true; // Allow command links

            return new vscode.Hover(markdown);
        }

        for (const child of symbol.children) {
            const hoverResult = this.getHoverForSymbol(child, position);
            if (hoverResult) {
                return hoverResult;
            }
        }

        return null;
    }

    private isPositionInRange(position: vscode.Position, range: vscode.Range): boolean {
        return (
            position.line === range.start.line || position.line === range.end.line
        );
    }
}


export class XtemplateFoldingRangeProvider implements vscode.FoldingRangeProvider {
    constructor(private symbolProvider: XTemplateDocumentSymbolProvider) {}
    
	provideFoldingRanges(
		document: vscode.TextDocument,
		context: vscode.FoldingContext,
		token: vscode.CancellationToken
	): vscode.FoldingRange[] {
		return this.symbolProvider.provideFoldingRanges();
	}
}

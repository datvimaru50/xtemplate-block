import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

class XTemplateBlock extends vscode.TreeItem {
    public children: XTemplateBlock[] = [];
    public parent: XTemplateBlock | null = null;
    public startLine: number;
    public endLine: number;

    constructor(
        public readonly name: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        startLine: number,
        endLine: number = -1
    ) {
        super(name, collapsibleState);
        this.startLine = startLine;
        this.endLine = endLine;
        this.tooltip = `${name} (Lines ${startLine}-${endLine})`;
        this.description = `Lines ${startLine}-${endLine}`;
    }
}

export class XtemplateBlocksProvider implements vscode.TreeDataProvider<XTemplateBlock> {
    private _onDidChangeTreeData: vscode.EventEmitter<XTemplateBlock | undefined | null | void> = new vscode.EventEmitter<XTemplateBlock | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<XTemplateBlock | undefined | null | void> = this._onDidChangeTreeData.event;
    private rootBlocks: XTemplateBlock[] = [];

    constructor(private activeTplFileContent: string) {
        this.parseBlocks();
    }

    private parseBlocks() {
        const lines = this.activeTplFileContent.split('\n');
        const stack: XTemplateBlock[] = [];
        this.rootBlocks = [];

        lines.forEach((line, index) => {
            // Check for BEGIN block
            const beginMatch = line.match(/<!--\s*BEGIN:\s*(\w+)\s*-->/);
            if (beginMatch) {
                const blockName = beginMatch[1];
                const block = new XTemplateBlock(
                    blockName,
                    vscode.TreeItemCollapsibleState.Expanded,
                    index + 1
                );

                if (stack.length > 0) {
                    // Add as child to current parent
                    const parent = stack[stack.length - 1];
                    block.parent = parent;
                    parent.children.push(block);
                } else {
                    // Add to root blocks
                    this.rootBlocks.push(block);
                }

                stack.push(block);
            }

            // Check for END block
            const endMatch = line.match(/<!--\s*END:\s*(\w+)\s*-->/);
            if (endMatch) {
                const blockName = endMatch[1];
                if (stack.length > 0 && stack[stack.length - 1].name === blockName) {
                    const block = stack.pop()!;
                    block.endLine = index + 1;
                }
            }
        });
    }

    getTreeItem(element: XTemplateBlock): vscode.TreeItem {
        return element;
    }

    getChildren(element?: XTemplateBlock): Thenable<XTemplateBlock[]> {
        if (!element) {
            return Promise.resolve(this.rootBlocks);
        }
        return Promise.resolve(element.children);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    public updateContent(newContent: string) {
        this.activeTplFileContent = newContent;
        this.parseBlocks();
        this.refresh();
    }
}

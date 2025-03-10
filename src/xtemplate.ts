import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class XtemplateBlocksProvider implements vscode.TreeDataProvider<any> {
    constructor(private activeTplFileContent: string) { }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    getChildren(element?: any): Thenable<any[]> {
        
        return Promise.resolve([]);
    }
}
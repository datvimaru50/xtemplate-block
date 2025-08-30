// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { XtemplateBlocksProvider, XTemplateDocumentSymbolProvider } from './xtemplate';
import { start } from 'repl';
import { isArray } from 'util';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "xtemplate-block" is now active!');
	
	vscode.languages.registerFoldingRangeProvider({ language: 'html' }, new MyFoldingRangeProvider());


	// Create the XTemplate blocks provider
	let xtemplateBlocksProvider: XtemplateBlocksProvider;

	// Initialize with current active editor if it exists
	if (vscode.window.activeTextEditor) {
		xtemplateBlocksProvider = new XtemplateBlocksProvider(vscode.window.activeTextEditor.document.getText());
	} else {
		xtemplateBlocksProvider = new XtemplateBlocksProvider('');
	}

	// Register the tree data provider
	vscode.window.registerTreeDataProvider('xtemplatetree', xtemplateBlocksProvider);

	// Update tree when active editor changes
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor && editor.document.languageId === 'html') {
			xtemplateBlocksProvider.updateContent(editor.document.getText());
		}
	});

	// Update tree when document changes
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document === vscode.window.activeTextEditor?.document &&
			event.document.languageId === 'html') {
			xtemplateBlocksProvider.updateContent(event.document.getText());
		}
	});

	// Register the DocumentSymbolProvider for HTML language
	vscode.languages.registerDocumentSymbolProvider(
		{ language: 'html' },
		new XTemplateDocumentSymbolProvider()
	);


	// Đăng ký một luật fold mới cho ngôn gữ HTML
	// vscode.languages.registerFoldingRangeProvider()

	// vscode.languages.registerDocumentSymbolProvider()

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('xtemplate-block.helloDat', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello Dat Fit');
	});

	context.subscriptions.push(disposable);
}

class MyFoldingRangeProvider implements vscode.FoldingRangeProvider {
	provideFoldingRanges(
		document: vscode.TextDocument,
		context: vscode.FoldingContext,
		token: vscode.CancellationToken
	): vscode.FoldingRange[] {
		const foldingRanges: vscode.FoldingRange[] = [];
		
		const startRegex = /<!--\s*BEGIN:\s*([\w\d_-]+)\s*-->/;

		let startMatch: RegExpExecArray | null;
		let endMatch: RegExpExecArray | null;
		
		findAndPush(0, document.lineCount-1);
		
		function findAndPush(start: number, end: number) {
			const text = document.getText(new vscode.Range(start, 0, end, 1000));
			while ((startMatch = startRegex.exec(text)) !== null) {
				const blockName = startMatch[1];
				const endBlockRegex = new RegExp(String.raw`\<!--\s*END:\s*${blockName}\s*-->`, "g");
				
				if ((endMatch = endBlockRegex.exec(text)) !== null) {
					
					// Phải quy về tọa tuyệt đối
					let absoluteIndex = document.offsetAt(new vscode.Position(start, 0));
					
					const foundStart = document.positionAt(absoluteIndex + startMatch.index).line;
					const foundEnd = document.positionAt(absoluteIndex + endMatch.index).line;
					
					foldingRanges.push({
						start: foundStart,
						end: foundEnd
					});
					
					// Tìm vào bên trong vùng vừa tìm được
					findAndPush(foundStart+1, foundEnd-1);
					
					// Tìm tiếp xuống phía dưới
					findAndPush(foundEnd+1, end);
					
					// Break khỏ
					break;
				}
			}
		}
		
		return foldingRanges;
	}
}

// This method is called when your extension is DEACTIVATED
export function deactivate() { }

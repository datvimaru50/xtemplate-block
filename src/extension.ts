// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { XtemplateBlocksProvider } from './xtemplate';
import { start } from 'repl';
import { isArray } from 'util';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "xtemplate-block" is now active!');
	
	vscode.languages.registerFoldingRangeProvider({ language: 'html' }, new MyFoldingRangeProvider());


	// TODO: Tìm xem cách lấy nội dung file tpl đang mở thì làm thế nào
	const fileContent = "";

	// Samples of `window.registerTreeDataProvider`
	const xtemplateBlocksProvider = new XtemplateBlocksProvider(fileContent);
	vscode.window.registerTreeDataProvider('xtemplatetree', xtemplateBlocksProvider);


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
		const text = document.getText();
		
		const startRegex = /<!--\s*BEGIN:\s*([\w\d_-]+)\s*-->/g;

		let startMatch: RegExpExecArray | null;
		let endMatch: RegExpExecArray | null;

		// Tìm các cặp BEGIN END tương ứng
		while ((startMatch = startRegex.exec(text)) !== null) {
			const blockName = startMatch[0].split("--")[1].replace("BEGIN:", "").trim();
			const endBlockRegex = new RegExp(String.raw`\<!--\s*END:\s*${blockName}\s*-->`, "g");
			
			if ((endMatch = endBlockRegex.exec(text)) !== null) {
				foldingRanges.push({
					start: document.positionAt(startMatch.index).line,
					end: document.positionAt(endMatch.index).line
				});
			}
		}
		
		return foldingRanges;
	}
}

// This method is called when your extension is DEACTIVATED
export function deactivate() { }

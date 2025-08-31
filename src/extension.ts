// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { XTemplateDocumentSymbolProvider, XTemplateHoverProvider, XtemplateFoldingRangeProvider } from './xtemplate';
import { start } from 'repl';
import { isArray } from 'util';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Hello Xtemplate!');
	
	// Khởi tạo để dùng cho cả 3 chỗ
	const Symbols = new XTemplateDocumentSymbolProvider();
	
	// Tạo cấu trúc tree of Symbol
	vscode.languages.registerDocumentSymbolProvider(
		{ language: 'html' },
		Symbols
	);
	
	// Shrink/Expand
	vscode.languages.registerFoldingRangeProvider(
		{ language: 'html' }, 
		new XtemplateFoldingRangeProvider( Symbols )
	);

	// Hover hiện ra đường dẫn
	vscode.languages.registerHoverProvider(
		{ language: 'html' },
		new XTemplateHoverProvider( Symbols )
	);
}

// This method is called when your extension is DEACTIVATED
export function deactivate() { }

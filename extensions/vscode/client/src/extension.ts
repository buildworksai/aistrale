import * as vscode from 'vscode';
import { Aistrale } from '@aistrale/sdk';

export function activate(context: vscode.ExtensionContext) {
    console.log('Aistrale Extension Activated');

    // Command: Run Inference
    let disposable = vscode.commands.registerCommand('aistrale.runInference', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

        vscode.window.showInformationMessage('Running inference...');

        try {
            // In a real extension, we would bundle the SDK or make HTTP calls directly
            // For this skeleton, we assume the SDK is available
            const client = new Aistrale();
            const result = await client.run(text);
            const content = result.choices[0].message.content;

            // Show result in a new panel or simpler, just an output channel
            const outputChannel = vscode.window.createOutputChannel("Aistrale Output");
            outputChannel.show();
            outputChannel.appendLine(content);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Inference failed: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

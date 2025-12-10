import React, { useState } from 'react';
import Layout from '../components/Layout';

interface SDK {
    name: string;
    language: string;
    version: string;
    description: string;
    installation: string;
    codeExample: string;
    apiReference: string;
}

const sdks: SDK[] = [
    {
        name: 'Python SDK',
        language: 'python',
        version: '1.0.0',
        description: 'Official Python SDK for AISTRALE',
        installation: 'pip install aistrale',
        codeExample: `from aistrale import AISTRALE

client = AISTRALE(api_key="your-api-key")

# Run inference
response = client.inference.run(
    model="smart-fast",
    prompt="Hello, world!"
)

print(response.output)`,
        apiReference: 'https://docs.aistrale.com/python',
    },
    {
        name: 'TypeScript SDK',
        language: 'typescript',
        version: '1.0.0',
        description: 'Official TypeScript/JavaScript SDK for AISTRALE',
        installation: 'npm install @aistrale/sdk',
        codeExample: `import { AISTRALE } from '@aistrale/sdk';

const client = new AISTRALE({
  apiKey: 'your-api-key'
});

// Run inference
const response = await client.inference.run({
  model: 'smart-fast',
  prompt: 'Hello, world!'
});

console.log(response.output);`,
        apiReference: 'https://docs.aistrale.com/typescript',
    },
];

export default function SDKs() {
    const [selectedSDK, setSelectedSDK] = useState<SDK>(sdks[0]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopyCode = (code: string, sdkName: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(sdkName);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">SDKs & Integration</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Developer tools and SDKs for easy integration</p>
                </div>

                {/* SDK Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Available SDKs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sdks.map(sdk => (
                            <button
                                key={sdk.name}
                                onClick={() => setSelectedSDK(sdk)}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${
                                    selectedSDK.name === sdk.name
                                        ? 'border-primary-main bg-primary-main/5 dark:bg-primary-main/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-main/50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sdk.name}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">v{sdk.version}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{sdk.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span className="capitalize">{sdk.language}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Installation Guide */}
                {selectedSDK && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Installation</h2>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                            <code className="text-sm text-gray-900 dark:text-gray-100 font-mono">{selectedSDK.installation}</code>
                            <button
                                onClick={() => handleCopyCode(selectedSDK.installation, 'installation')}
                                className="ml-4 text-primary-main hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Copy installation command"
                            >
                                {copiedCode === 'installation' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Code Examples */}
                {selectedSDK && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Code Example</h2>
                            <button
                                onClick={() => handleCopyCode(selectedSDK.codeExample, 'code')}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-primary-main hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main rounded min-h-[44px]"
                                aria-label="Copy code example"
                            >
                                {copiedCode === 'code' ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                            <code className="text-sm text-gray-900 dark:text-gray-100 font-mono">{selectedSDK.codeExample}</code>
                        </pre>
                    </div>
                )}

                {/* API Reference */}
                {selectedSDK && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">API Reference</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Full API documentation and reference guide for {selectedSDK.name}
                        </p>
                        <a
                            href={selectedSDK.apiReference}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <span>View API Reference</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                )}

                {/* Quick Start Guide */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Start Guide</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-main text-white flex items-center justify-center font-semibold text-sm">
                                1
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Install the SDK</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Install the SDK using the package manager for your language
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-main text-white flex items-center justify-center font-semibold text-sm">
                                2
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Get Your API Key</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Sign up and get your API key from the dashboard
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-main text-white flex items-center justify-center font-semibold text-sm">
                                3
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Initialize the Client</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Create a client instance with your API key
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-main text-white flex items-center justify-center font-semibold text-sm">
                                4
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Run Your First Inference</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Use the client to run inference with any supported model
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}


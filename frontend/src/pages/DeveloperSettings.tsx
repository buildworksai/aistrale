import React, { useState } from 'react';
import { webhookService } from '../lib/api/services';
import Layout from '../components/Layout';

const DeveloperSettings: React.FC = () => {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [testPayload, setTestPayload] = useState('{"message": "Hello World"}');
    const [dispatchResult, setDispatchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Mock workspace
    const workspaceId = 1;

    const handleDispatch = async () => {
        setLoading(true);
        try {
            // In real scenario, URL would be saved in backend config
            // Here we just test dispatch to a type
            const payload = JSON.parse(testPayload);
            const res = await webhookService.dispatchTest(workspaceId, 'test_event', payload);
            setDispatchResult(res);
        } catch (e: any) {
            console.error(e);
            setDispatchResult({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Developer Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage webhooks and API integration.</p>
                </header>

                {/* Webhook Configuration */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Webhook Configuration</h2>
                    <div className="max-w-2xl">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://your-api.com/webhooks"
                                className="flex-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <button className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition">Save</button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">We will send a POST request to this URL for configured events.</p>
                    </div>
                </section>

                {/* Test Console */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Test Dispatcher</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Payload (JSON)</label>
                            <textarea
                                value={testPayload}
                                onChange={(e) => setTestPayload(e.target.value)}
                                className="w-full h-40 font-mono text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <button
                                onClick={handleDispatch}
                                disabled={loading}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition"
                            >
                                {loading ? 'Dispatching...' : 'Send Test Event'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response / Result</label>
                            <div className="w-full h-40 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4 overflow-auto font-mono text-xs text-gray-900 dark:text-gray-100">
                                {dispatchResult ? (
                                    <pre>{JSON.stringify(dispatchResult, null, 2)}</pre>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-500">Waiting for dispatch...</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default DeveloperSettings;

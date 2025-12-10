import React, { useState, useEffect } from 'react';
import { securityService, type AuditLog } from '../lib/api/services';

import Layout from '../components/Layout';

const SecurityDashboard: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [redactedText, setRedactedText] = useState('');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        const logs = await securityService.getAuditLogs();
        setAuditLogs(logs);
    };

    const handleRedact = async () => {
        if (!inputText) return;
        setLoading(true);
        try {
            const result = await securityService.redactPii(inputText);
            setRedactedText(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* PII Redaction Tool */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">PII Redaction Tester</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Text</label>
                            <textarea
                                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="Enter text with PII (e.g., SSN 123-45-6789)..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <button
                                onClick={handleRedact}
                                disabled={loading}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition"
                            >
                                {loading ? 'Redacting...' : 'Redact PII'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Redacted Output</label>
                            <div className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm overflow-auto text-gray-900 dark:text-gray-100">
                                {redactedText || <span className="text-gray-400 dark:text-gray-500">Result will appear here...</span>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Audit Logs */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Recent Audit Logs</h2>
                        <button onClick={loadLogs} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Refresh</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{log.user_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.resource_type} / {log.resource_id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <pre className="whitespace-pre-wrap font-mono text-xs">{typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}</pre>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Compliance Controls */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Data Residency Controls</h2>
                    <div className="flex items-center space-x-4">
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Region</label>
                            <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                <option>us-east-1 (N. Virginia)</option>
                                <option>eu-central-1 (Frankfurt)</option>
                                <option>ap-northeast-1 (Tokyo)</option>
                            </select>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md text-sm mt-6 flex-1">
                            Changing residency region will only affect new workspaces. Existing data remains in original region for compliance.
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default SecurityDashboard;

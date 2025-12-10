import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Token {
    id: number;
    provider: string;
    label: string;
    token_value: string;
    is_default: boolean;
}

export default function Tokens() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [label, setLabel] = useState('');
    const [tokenValue, setTokenValue] = useState('');
    const [provider, setProvider] = useState('huggingface');
    const [isDefault, setIsDefault] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [editingToken, setEditingToken] = useState<Token | null>(null);

    const fetchTokens = async () => {
        const res = await api.get('/api/tokens/');
        setTokens(res.data);
    };

    useEffect(() => {
        fetchTokens();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.post('/api/tokens/', { label, token_value: tokenValue, provider, is_default: isDefault });
        setLabel('');
        setTokenValue('');
        setProvider('huggingface');
        setIsDefault(false);
        setIsCreateModalOpen(false);
        fetchTokens();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingToken) return;

        await api.put(`/api/tokens/${editingToken.id}`, editingToken);
        setEditingToken(null);
        fetchTokens();
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/api/tokens/${id}`);
        fetchTokens();
    };

    const handleSetDefault = async (id: number) => {
        await api.put(`/api/tokens/${id}/default`);
        fetchTokens();
    };

    return (
        <Layout>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">API Keys Tokens</h3>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex justify-center py-1.5 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-main hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                    >
                        Create API Token
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Label</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Provider</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {tokens.map((token) => (
                                <tr key={token.id}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {token.label}
                                        {token.is_default && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                Default
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{token.provider}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 space-x-4">
                                        <button
                                            onClick={() => setEditingToken(token)}
                                            className="text-primary-main hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-main"
                                        >
                                            Edit
                                        </button>
                                        {!token.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(token.id)}
                                                className="text-primary-main hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-main"
                                            >
                                                Make Default
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(token.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Create New Token</h3>
                        <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
                                <select
                                    name="token_provider"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="huggingface">Hugging Face</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="groq">Groq</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="gemini">Google Gemini</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
                                <input
                                    name="token_label"
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Value</label>
                                <input
                                    name="token_value_new"
                                    type="password"
                                    value={tokenValue}
                                    onChange={(e) => setTokenValue(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="is_default"
                                    name="is_default"
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                    className="h-4 w-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                                />
                                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Set as default provider
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-main hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingToken && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Edit Token</h3>
                        <form onSubmit={handleUpdate} className="space-y-4" autoComplete="off">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
                                <select
                                    name="edit_token_provider"
                                    value={editingToken.provider}
                                    onChange={(e) => setEditingToken({ ...editingToken, provider: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="huggingface">Hugging Face</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="groq">Groq</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="gemini">Google Gemini</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
                                <input
                                    name="edit_token_label"
                                    type="text"
                                    value={editingToken.label}
                                    onChange={(e) => setEditingToken({ ...editingToken, label: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Value</label>
                                <input
                                    name="edit_token_value_new"
                                    type="password"
                                    value={editingToken.token_value}
                                    onChange={(e) => setEditingToken({ ...editingToken, token_value: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="edit_is_default"
                                    name="edit_is_default"
                                    type="checkbox"
                                    checked={editingToken.is_default}
                                    onChange={(e) => setEditingToken({ ...editingToken, is_default: e.target.checked })}
                                    className="h-4 w-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                                />
                                <label htmlFor="edit_is_default" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Set as default provider
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingToken(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-main hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                                >
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

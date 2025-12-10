import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Prompt {
    id: number;
    name: string;
    template: string;
    input_variables: string[];
    version: number;
    created_at: string;
    updated_at: string;
}

export default function Prompts() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [template, setTemplate] = useState('');
    const [inputVariables, setInputVariables] = useState('');

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/prompts/');
            setPrompts(res.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch prompts');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            const variables = inputVariables
                .split(',')
                .map(v => v.trim())
                .filter(v => v.length > 0);
            
            await api.post('/api/prompts/', {
                name,
                template,
                input_variables: variables
            });
            
            setName('');
            setTemplate('');
            setInputVariables('');
            setIsCreateModalOpen(false);
            fetchPrompts();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create prompt');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPrompt) return;

        try {
            setError('');
            const variables = inputVariables
                .split(',')
                .map(v => v.trim())
                .filter(v => v.length > 0);
            
            await api.patch(`/api/prompts/${editingPrompt.id}`, {
                template: template || editingPrompt.template,
                input_variables: variables.length > 0 ? variables : editingPrompt.input_variables
            });
            
            setEditingPrompt(null);
            setTemplate('');
            setInputVariables('');
            fetchPrompts();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to update prompt');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
            return;
        }

        try {
            setError('');
            await api.delete(`/api/prompts/${id}`);
            fetchPrompts();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete prompt');
        }
    };

    const handleView = async (id: number) => {
        try {
            const res = await api.get(`/api/prompts/${id}`);
            setViewingPrompt(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch prompt');
        }
    };

    const openEditModal = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setTemplate(prompt.template);
        setInputVariables(prompt.input_variables.join(', '));
    };

    const closeModals = () => {
        setIsCreateModalOpen(false);
        setEditingPrompt(null);
        setViewingPrompt(null);
        setName('');
        setTemplate('');
        setInputVariables('');
        setError('');
    };

    return (
        <Layout>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Prompt Templates</h3>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex justify-center py-1.5 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-main hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Prompt
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {loading && prompts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading prompts...</p>
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No prompts yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first prompt template to get started</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Template Preview</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Variables</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Version</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {prompts.map((prompt) => (
                                    <tr key={prompt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {prompt.name}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={prompt.template}>
                                            {prompt.template}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {prompt.input_variables.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {prompt.input_variables.map((v, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">None</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            v{prompt.version}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 space-x-2">
                                            <button
                                                onClick={() => handleView(prompt.id)}
                                                className="text-primary-main hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-main"
                                                title="View prompt"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => openEditModal(prompt)}
                                                className="text-primary-main hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-main"
                                                title="Edit prompt"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prompt.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                title="Delete prompt"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Create New Prompt</h3>
                                <button
                                    onClick={closeModals}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Customer Support Response"
                                        required
                                        autoComplete="off"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">A unique name for this prompt template</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Template <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={template}
                                        onChange={(e) => setTemplate(e.target.value)}
                                        rows={8}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                                        placeholder="Enter your prompt template. Use {{variable_name}} for variables."
                                        required
                                        autoComplete="off"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Use <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{"{{variable_name}}"}</code> to define variables
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Input Variables
                                    </label>
                                    <input
                                        type="text"
                                        value={inputVariables}
                                        onChange={(e) => setInputVariables(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., customer_name, issue_description"
                                        autoComplete="off"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Comma-separated list of variable names</p>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={closeModals}
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
                {editingPrompt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Edit Prompt: {editingPrompt.name}</h3>
                                <button
                                    onClick={closeModals}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleUpdate} className="space-y-4" autoComplete="off">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Template <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={template}
                                        onChange={(e) => setTemplate(e.target.value)}
                                        rows={8}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                                        placeholder="Enter your prompt template. Use {{variable_name}} for variables."
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Input Variables
                                    </label>
                                    <input
                                        type="text"
                                        value={inputVariables}
                                        onChange={(e) => setInputVariables(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., customer_name, issue_description"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={closeModals}
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

                {/* View Modal */}
                {viewingPrompt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">View Prompt: {viewingPrompt.name}</h3>
                                <button
                                    onClick={closeModals}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">{viewingPrompt.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
                                    <pre className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded font-mono whitespace-pre-wrap">{viewingPrompt.template}</pre>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input Variables</label>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingPrompt.input_variables.length > 0 ? (
                                            viewingPrompt.input_variables.map((v, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {v}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">No variables</span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">v{viewingPrompt.version}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Updated</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                            {new Date(viewingPrompt.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => {
                                            setViewingPrompt(null);
                                            openEditModal(viewingPrompt);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-main hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={closeModals}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}


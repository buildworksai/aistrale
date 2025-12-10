import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Evaluation {
    id: number;
    name: string;
    dataset_path: string;
    metric: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    prompt_id: number;
    created_at: string;
    updated_at: string;
    user_id: number | null;
}

interface EvaluationResult {
    id: number;
    input: string;
    output: string;
    score: number;
    feedback: string | null;
    evaluation_id: number;
    created_at: string;
}

interface TestSuite {
    evaluation: Evaluation;
    results: EvaluationResult[];
    summary: {
        total_tests: number;
        passed: number;
        failed: number;
        avg_score: number;
    };
}

export default function Evaluation() {
    const [suites, setSuites] = useState<Evaluation[]>([]);
    const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
    const [executingId, setExecutingId] = useState<number | null>(null);

    // Form state
    const [suiteName, setSuiteName] = useState('');
    const [datasetPath, setDatasetPath] = useState('');
    const [metric, setMetric] = useState('accuracy');
    const [promptId, setPromptId] = useState<number | ''>('');
    const [prompts, setPrompts] = useState<any[]>([]);

    const availableMetrics = [
        { value: 'accuracy', label: 'Accuracy' },
        { value: 'f1_score', label: 'F1 Score' },
        { value: 'bleu', label: 'BLEU' },
        { value: 'rouge', label: 'ROUGE' },
        { value: 'semantic_similarity', label: 'Semantic Similarity' },
    ];

    useEffect(() => {
        fetchSuites();
        fetchPrompts();
    }, []);

    const fetchSuites = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/evaluation/');
            setSuites(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch evaluation suites';
            setError(errorMsg);
            setSuites([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchPrompts = async () => {
        try {
            const res = await api.get('/api/prompts/');
            setPrompts(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Failed to fetch prompts:', err);
        }
    };

    const fetchSuiteResults = async (suiteId: number) => {
        try {
            setLoading(true);
            setError('');
            // Assuming endpoint exists: GET /api/evaluation/{id}/results
            const res = await api.get(`/api/evaluation/${suiteId}/results`);
            setSelectedSuite(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch evaluation results');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!suiteName || !datasetPath || !promptId) {
            setError('Name, dataset path, and prompt are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const suite = {
                name: suiteName,
                dataset_path: datasetPath,
                metric,
                prompt_id: promptId,
            };
            
            const res = await api.post('/api/evaluation', suite);
            setSuites([...suites, res.data]);
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create evaluation suite');
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async (suiteId: number) => {
        try {
            setExecutingId(suiteId);
            setError('');
            // Assuming endpoint exists: POST /api/evaluation/{id}/run
            await api.post(`/api/evaluation/${suiteId}/run`);
            fetchSuites();
            setTimeout(() => {
                fetchSuiteResults(suiteId);
                setExecutingId(null);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to execute evaluation');
            setExecutingId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this evaluation suite?')) {
            return;
        }

        try {
            await api.delete(`/api/evaluation/${id}`);
            setSuites(suites.filter(s => s.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete evaluation suite');
        }
    };

    const resetForm = () => {
        setSuiteName('');
        setDatasetPath('');
        setMetric('accuracy');
        setPromptId('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'running':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'pending':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Evaluation</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and run evaluation test suites</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create evaluation suite"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Test Suite
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm flex-1">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Dismiss error"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Test Suites List */}
                {!loading && suites.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suites.map(suite => (
                            <div
                                key={suite.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                            {suite.name}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(suite.status)}`}>
                                            {suite.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Metric:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                            {suite.metric.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Prompt ID:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {suite.prompt_id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Created:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {new Date(suite.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => fetchSuiteResults(suite.id)}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-primary-main hover:text-primary-dark bg-primary-main/10 hover:bg-primary-main/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        View Results
                                    </button>
                                    <button
                                        onClick={() => handleExecute(suite.id)}
                                        disabled={executingId === suite.id || suite.status === 'running'}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px] disabled:opacity-50"
                                    >
                                        {executingId === suite.id ? 'Running...' : 'Run'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(suite.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label={`Delete suite ${suite.name}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && suites.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading evaluation suites...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && suites.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No evaluation suites found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a test suite to evaluate your prompts</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Test Suite
                        </button>
                    </div>
                )}

                {/* Results View */}
                {selectedSuite && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedSuite.evaluation.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedSuite.summary.total_tests} tests • Avg Score: {(selectedSuite.summary.avg_score * 100).toFixed(1)}%
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSuite(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Close results"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Tests</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedSuite.summary.total_tests}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Passed</h3>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedSuite.summary.passed}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Failed</h3>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedSuite.summary.failed}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Score</h3>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(selectedSuite.summary.avg_score * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Results Table */}
                        {selectedSuite.results && selectedSuite.results.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Input</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Output</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Feedback</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {selectedSuite.results.map(result => (
                                            <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                                                    {result.input}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                                    {result.output}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        result.score >= 0.8
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : result.score >= 0.5
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                        {(result.score * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {result.feedback || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Suite Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Evaluation Suite</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label htmlFor="suite-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Suite Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="suite-name"
                                        value={suiteName}
                                        onChange={(e) => setSuiteName(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="e.g., Prompt Quality Test"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="dataset-path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Dataset Path <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="dataset-path"
                                        value={datasetPath}
                                        onChange={(e) => setDatasetPath(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="/path/to/dataset.json"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="metric" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Evaluation Metric <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="metric"
                                            value={metric}
                                            onChange={(e) => setMetric(e.target.value)}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            required
                                        >
                                            {availableMetrics.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="prompt-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Prompt <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="prompt-id"
                                            value={promptId}
                                            onChange={(e) => setPromptId(e.target.value ? Number(e.target.value) : '')}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            required
                                        >
                                            <option value="">Select prompt</option>
                                            {prompts.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !suiteName || !datasetPath || !promptId}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Creating...' : 'Create Suite'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}


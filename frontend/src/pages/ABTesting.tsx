import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface ABTest {
    id: number;
    name: string;
    prompt: string;
    providers: string[];
    status: 'running' | 'completed';
    created_at: string;
}

interface ABTestResult {
    id: number;
    ab_test_id: number;
    provider: string;
    response: string;
    latency_ms: number;
    cost: number;
    quality_score: number;
}

interface TestResults {
    test: ABTest;
    results: ABTestResult[];
    statistics: {
        [provider: string]: {
            avg_latency: number;
            avg_cost: number;
            avg_quality: number;
            total_responses: number;
        };
    };
}

export default function ABTesting() {
    const [tests, setTests] = useState<ABTest[]>([]);
    const [selectedTest, setSelectedTest] = useState<TestResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [testName, setTestName] = useState('');
    const [testPrompt, setTestPrompt] = useState('');
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

    const availableProviders = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/multi-provider/ab-test');
            setTests(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch A/B tests';
            setError(errorMsg);
            setTests([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchTestResults = async (testId: number) => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get(`/api/multi-provider/ab-test/${testId}`);
            // Handle response structure
            const data = res.data;
            if (data) {
                setSelectedTest({
                    test: data.test || { id: testId, name: 'Test', prompt: '', providers: [], status: 'completed', created_at: new Date().toISOString() },
                    results: Array.isArray(data.results) ? data.results : (Array.isArray(data.details) ? data.details : []),
                    statistics: data.statistics || {}
                });
            } else {
                setSelectedTest(null);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch test results';
            setError(errorMsg);
            setSelectedTest(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testName || !testPrompt || selectedProviders.length < 2) {
            setError('Name, prompt, and at least 2 providers are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await api.post('/api/multi-provider/ab-test/start', {
                name: testName,
                prompt: testPrompt,
                providers: selectedProviders,
            });
            setTests([...tests, res.data]);
            setIsCreateModalOpen(false);
            setTestName('');
            setTestPrompt('');
            setSelectedProviders([]);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create A/B test');
        } finally {
            setLoading(false);
        }
    };

    const toggleProvider = (provider: string) => {
        if (selectedProviders.includes(provider)) {
            setSelectedProviders(selectedProviders.filter(p => p !== provider));
        } else {
            setSelectedProviders([...selectedProviders, provider]);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getWinner = (statistics: { [key: string]: any }): string | null => {
        if (!statistics || Object.keys(statistics).length === 0) return null;
        
        // Determine winner based on quality score (highest wins)
        let winner = null;
        let highestQuality = -1;
        
        Object.entries(statistics).forEach(([provider, stats]) => {
            if (stats.avg_quality > highestQuality) {
                highestQuality = stats.avg_quality;
                winner = provider;
            }
        });
        
        return winner;
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">A/B Testing</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Test prompts across multiple providers</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create A/B test"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Test
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

                {/* Tests List */}
                {!loading && tests.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tests.map(test => (
                            <div
                                key={test.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => fetchTestResults(test.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            {test.name}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                                            {test.status}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                    {test.prompt}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {test.providers.map(provider => (
                                        <span
                                            key={provider}
                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                            {provider}
                                        </span>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Created {new Date(test.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && tests.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading A/B tests...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && tests.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No A/B tests found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a test to compare providers</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Test
                        </button>
                    </div>
                )}

                {/* Test Results */}
                {selectedTest && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedTest.test.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedTest.test.prompt}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTest(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Close results"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Statistics */}
                        {selectedTest.statistics && Object.keys(selectedTest.statistics).length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(selectedTest.statistics).map(([provider, stats]) => {
                                        const isWinner = getWinner(selectedTest.statistics) === provider;
                                        return (
                                            <div
                                                key={provider}
                                                className={`border-2 rounded-lg p-4 ${
                                                    isWinner
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                                                        : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                                        {provider}
                                                    </h4>
                                                    {isWinner && (
                                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                                            Winner
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Avg Latency:</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {stats.avg_latency.toFixed(0)}ms
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Avg Cost:</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            ${stats.avg_cost.toFixed(4)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Avg Quality:</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {(stats.avg_quality * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Responses:</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {stats.total_responses}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Results Table */}
                        {selectedTest.results && selectedTest.results.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Results</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Response</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Latency</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedTest.results.map(result => (
                                                <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                        {result.provider}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                        {result.response}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {result.latency_ms.toFixed(0)}ms
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        ${result.cost.toFixed(4)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {(result.quality_score * 100).toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Test Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create A/B Test</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setTestName('');
                                        setTestPrompt('');
                                        setSelectedProviders([]);
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
                                    <label htmlFor="test-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Test Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="test-name"
                                        value={testName}
                                        onChange={(e) => setTestName(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="e.g., Prompt Optimization Test"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="test-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Test Prompt <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="test-prompt"
                                        value={testPrompt}
                                        onChange={(e) => setTestPrompt(e.target.value)}
                                        rows={6}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main"
                                        placeholder="Enter the prompt to test across providers..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Providers <span className="text-red-500">*</span> (Select at least 2)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableProviders.map(provider => (
                                            <button
                                                key={provider}
                                                type="button"
                                                onClick={() => toggleProvider(provider)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                                                    selectedProviders.includes(provider)
                                                        ? 'bg-primary-main text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {provider}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedProviders.length < 2 && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                            Please select at least 2 providers
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setTestName('');
                                            setTestPrompt('');
                                            setSelectedProviders([]);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !testName || !testPrompt || selectedProviders.length < 2}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Creating...' : 'Create Test'}
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


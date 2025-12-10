import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface LoadBalancer {
    id: number;
    name: string;
    algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'latency-based';
    providers: string[];
    weights: { [key: string]: number };
    enabled: boolean;
}

interface Distribution {
    provider: string;
    requests: number;
    percentage: number;
    capacity: number;
    current_load: number;
}

interface LoadBalancerAnalytics {
    total_requests: number;
    avg_latency: number;
    distribution: Distribution[];
    algorithm_performance: { [key: string]: number };
}

export default function LoadBalancing() {
    const [balancers, setBalancers] = useState<LoadBalancer[]>([]);
    const [analytics, setAnalytics] = useState<LoadBalancerAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedBalancer, setSelectedBalancer] = useState<LoadBalancer | null>(null);

    // Form state
    const [balancerName, setBalancerName] = useState('');
    const [algorithm, setAlgorithm] = useState<'round-robin' | 'least-connections' | 'weighted' | 'latency-based'>('round-robin');
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [weights, setWeights] = useState<{ [key: string]: number }>({});
    const [enabled, setEnabled] = useState(true);

    const availableProviders = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];

    useEffect(() => {
        fetchBalancers();
        fetchAnalytics();
    }, []);

    const fetchBalancers = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/reliability/load-balancers');
            setBalancers(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch load balancers';
            setError(errorMsg);
            setBalancers([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/api/reliability/load-balancers/analytics');
            setAnalytics(res.data || {
                total_requests: 0,
                avg_latency: 0,
                distribution: [],
                algorithm_performance: {}
            });
        } catch (err: any) {
            console.error('Failed to fetch analytics:', err);
            setAnalytics({
                total_requests: 0,
                avg_latency: 0,
                distribution: [],
                algorithm_performance: {}
            });
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!balancerName || selectedProviders.length === 0) {
            setError('Name and at least one provider are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const balancer = {
                name: balancerName,
                algorithm,
                providers: selectedProviders,
                weights: algorithm === 'weighted' ? weights : {},
                enabled,
            };
            
            const res = await api.post('/api/reliability/load-balancers', balancer);
            setBalancers([...balancers, res.data]);
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create load balancer');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this load balancer?')) {
            return;
        }

        try {
            await api.delete(`/api/reliability/load-balancers/${id}`);
            setBalancers(balancers.filter(b => b.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete load balancer');
        }
    };

    const toggleProvider = (provider: string) => {
        if (selectedProviders.includes(provider)) {
            setSelectedProviders(selectedProviders.filter(p => p !== provider));
            const newWeights = { ...weights };
            delete newWeights[provider];
            setWeights(newWeights);
        } else {
            setSelectedProviders([...selectedProviders, provider]);
            if (algorithm === 'weighted') {
                setWeights({ ...weights, [provider]: 1 });
            }
        }
    };

    const updateWeight = (provider: string, weight: number) => {
        setWeights({ ...weights, [provider]: weight });
    };

    const resetForm = () => {
        setBalancerName('');
        setAlgorithm('round-robin');
        setSelectedProviders([]);
        setWeights({});
        setEnabled(true);
    };

    const getAlgorithmLabel = (algo: string) => {
        const labels: { [key: string]: string } = {
            'round-robin': 'Round Robin',
            'least-connections': 'Least Connections',
            'weighted': 'Weighted',
            'latency-based': 'Latency Based',
        };
        return labels[algo] || algo;
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Load Balancing</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Distribute requests across providers</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create load balancer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Load Balancer
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

                {/* Analytics */}
                {analytics && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Load Distribution</h2>
                        <div className="space-y-4">
                            {analytics.distribution.map(dist => (
                                <div key={dist.provider}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                                            {dist.provider}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {dist.requests} requests ({dist.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-primary-main h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${dist.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        <span>Capacity: {dist.capacity}%</span>
                                        <span>Load: {dist.current_load}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Load Balancers List */}
                {!loading && balancers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {balancers.map(balancer => (
                            <div
                                key={balancer.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                            {balancer.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                Algorithm:
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {getAlgorithmLabel(balancer.algorithm)}
                                            </span>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            balancer.enabled
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                        }`}>
                                            {balancer.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(balancer.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label={`Delete load balancer ${balancer.name}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Providers:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {balancer.providers.map(provider => (
                                                <span
                                                    key={provider}
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                >
                                                    {provider}
                                                    {balancer.algorithm === 'weighted' && balancer.weights[provider] && (
                                                        <span className="ml-1 text-gray-500">({balancer.weights[provider]})</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && balancers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading load balancers...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && balancers.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No load balancers configured</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a load balancer to distribute requests</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Load Balancer
                        </button>
                    </div>
                )}

                {/* Create Load Balancer Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Load Balancer</h2>
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
                                    <label htmlFor="balancer-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="balancer-name"
                                        value={balancerName}
                                        onChange={(e) => setBalancerName(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="e.g., Production Load Balancer"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Algorithm <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="algorithm"
                                        value={algorithm}
                                        onChange={(e) => {
                                            setAlgorithm(e.target.value as any);
                                            if (e.target.value !== 'weighted') {
                                                setWeights({});
                                            }
                                        }}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="round-robin">Round Robin</option>
                                        <option value="least-connections">Least Connections</option>
                                        <option value="weighted">Weighted</option>
                                        <option value="latency-based">Latency Based</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Providers <span className="text-red-500">*</span> (Select at least one)
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
                                    {selectedProviders.length === 0 && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                            Please select at least one provider
                                        </p>
                                    )}
                                </div>

                                {algorithm === 'weighted' && selectedProviders.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Weights
                                        </label>
                                        <div className="space-y-2">
                                            {selectedProviders.map(provider => (
                                                <div key={provider} className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize w-24">
                                                        {provider}:
                                                    </span>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={weights[provider] || 1}
                                                        onChange={(e) => updateWeight(provider, Number(e.target.value))}
                                                        className="flex-1 h-11"
                                                    />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8">
                                                        {weights[provider] || 1}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => setEnabled(e.target.checked)}
                                            className="w-4 h-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Enable this load balancer</span>
                                    </label>
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
                                        disabled={loading || !balancerName || selectedProviders.length === 0}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Creating...' : 'Create Load Balancer'}
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


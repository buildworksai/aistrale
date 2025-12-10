import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface ComparisonResult {
    provider1: string;
    provider2: string;
    metric: string;
    provider1_value: number;
    provider2_value: number;
    winner: string;
    details: {
        latency?: { provider1: number; provider2: number };
        cost?: { provider1: number; provider2: number };
        quality?: { provider1: number; provider2: number };
        reliability?: { provider1: number; provider2: number };
    };
}

interface ComparisonHistory {
    id: number;
    comparison_date: string;
    provider1: string;
    provider2: string;
    metric: string;
    provider1_value: number;
    provider2_value: number;
    winner: string;
}

export default function ProviderComparison() {
    const [comparison, setComparison] = useState<ComparisonResult | null>(null);
    const [history, setHistory] = useState<ComparisonHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [provider1, setProvider1] = useState('openai');
    const [provider2, setProvider2] = useState('anthropic');
    const [selectedMetric, setSelectedMetric] = useState('quality');
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['latency', 'cost', 'quality', 'reliability']);

    const availableProviders = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];
    const availableMetrics = [
        { value: 'latency', label: 'Latency' },
        { value: 'cost', label: 'Cost' },
        { value: 'quality', label: 'Quality' },
        { value: 'reliability', label: 'Reliability' },
        { value: 'throughput', label: 'Throughput' },
    ];

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/api/multi-provider/comparison/history');
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Failed to fetch comparison history:', err);
        }
    };

    const handleCompare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider1 || !provider2 || provider1 === provider2) {
            setError('Please select two different providers');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await api.post('/api/multi-provider/compare', null, {
                params: {
                    provider1,
                    provider2,
                    metric: selectedMetric,
                },
            });
            setComparison(res.data);
            fetchHistory();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to compare providers');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!comparison) return;

        const data = {
            comparison_date: new Date().toISOString(),
            provider1: comparison.provider1,
            provider2: comparison.provider2,
            metric: comparison.metric,
            provider1_value: comparison.provider1_value,
            provider2_value: comparison.provider2_value,
            winner: comparison.winner,
            details: comparison.details,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provider_comparison_${comparison.provider1}_vs_${comparison.provider2}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const toggleMetric = (metric: string) => {
        if (selectedMetrics.includes(metric)) {
            setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
        } else {
            setSelectedMetrics([...selectedMetrics, metric]);
        }
    };

    const getMetricValue = (metric: string, provider: string): number => {
        if (!comparison || !comparison.details) return 0;
        const details = comparison.details as any;
        if (details[metric]) {
            return details[metric][provider === comparison.provider1 ? 'provider1' : 'provider2'] || 0;
        }
        return 0;
    };

    const formatMetricValue = (metric: string, value: number): string => {
        switch (metric) {
            case 'latency':
                return `${value.toFixed(0)}ms`;
            case 'cost':
                return `$${value.toFixed(4)}`;
            case 'quality':
            case 'reliability':
                return `${(value * 100).toFixed(1)}%`;
            default:
                return value.toFixed(2);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Provider Comparison</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Compare providers side-by-side across multiple metrics</p>
                    </div>
                    {comparison && (
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            aria-label="Export comparison"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                    )}
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

                {/* Comparison Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <form onSubmit={handleCompare} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="provider1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Provider 1
                                </label>
                                <select
                                    id="provider1"
                                    value={provider1}
                                    onChange={(e) => setProvider1(e.target.value)}
                                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                >
                                    {availableProviders.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="provider2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Provider 2
                                </label>
                                <select
                                    id="provider2"
                                    value={provider2}
                                    onChange={(e) => setProvider2(e.target.value)}
                                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                >
                                    {availableProviders.filter(p => p !== provider1).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="metric" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Primary Metric
                                </label>
                                <select
                                    id="metric"
                                    value={selectedMetric}
                                    onChange={(e) => setSelectedMetric(e.target.value)}
                                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                >
                                    {availableMetrics.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Additional Metrics to Compare
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableMetrics.map(metric => (
                                    <button
                                        key={metric.value}
                                        type="button"
                                        onClick={() => toggleMetric(metric.value)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                                            selectedMetrics.includes(metric.value)
                                                ? 'bg-primary-main text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {metric.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || provider1 === provider2}
                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                            >
                                {loading ? 'Comparing...' : 'Compare Providers'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Comparison Results */}
                {comparison && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Comparison Results</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Winner:</span>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium capitalize">
                                    {comparison.winner}
                                </span>
                            </div>
                        </div>

                        {/* Side-by-Side Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="border-2 border-primary-main rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 capitalize">
                                    {comparison.provider1}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500 dark:text-gray-400">Primary Metric ({selectedMetric}):</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatMetricValue(selectedMetric, comparison.provider1_value)}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedMetrics.map(metric => {
                                        const value = getMetricValue(metric, comparison.provider1);
                                        return (
                                            <div key={metric} className="flex justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400 capitalize">{metric}:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {formatMetricValue(metric, value)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 capitalize">
                                    {comparison.provider2}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500 dark:text-gray-400">Primary Metric ({selectedMetric}):</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatMetricValue(selectedMetric, comparison.provider2_value)}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedMetrics.map(metric => {
                                        const value = getMetricValue(metric, comparison.provider2);
                                        return (
                                            <div key={metric} className="flex justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400 capitalize">{metric}:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {formatMetricValue(metric, value)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metric</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider capitalize">{comparison.provider1}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider capitalize">{comparison.provider2}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Winner</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                            {selectedMetric}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatMetricValue(selectedMetric, comparison.provider1_value)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatMetricValue(selectedMetric, comparison.provider2_value)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                            {comparison.winner}
                                        </td>
                                    </tr>
                                    {selectedMetrics.map(metric => {
                                        const value1 = getMetricValue(metric, comparison.provider1);
                                        const value2 = getMetricValue(metric, comparison.provider2);
                                        const winner = value1 < value2 ? comparison.provider1 : comparison.provider2;
                                        return (
                                            <tr key={metric} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                    {metric}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatMetricValue(metric, value1)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatMetricValue(metric, value2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                    {winner}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Comparison History */}
                {history.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Comparison History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Providers</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metric</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Winner</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {history.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(item.comparison_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                {item.provider1} vs {item.provider2}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                {item.metric}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                {item.winner}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}


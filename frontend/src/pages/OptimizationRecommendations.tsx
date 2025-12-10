import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Recommendation {
    id: number;
    type: 'model_switch' | 'prompt_optimization' | 'provider_switch' | 'batch_processing' | 'caching';
    title: string;
    description: string;
    current_cost: number;
    potential_savings: number;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    action_items: { [key: string]: any };
    created_at: string;
}

interface Comparison {
    current: { provider: string; model: string; cost: number };
    recommended: { provider: string; model: string; cost: number };
    savings: number;
}

export default function OptimizationRecommendations() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
    const [comparison, setComparison] = useState<Comparison | null>(null);
    const [filters, setFilters] = useState({
        type: 'all',
        impact: 'all',
        effort: 'all',
    });
    const [savingsCalculator, setSavingsCalculator] = useState({
        monthly_requests: 10000,
        current_cost_per_request: 0.01,
        recommended_cost_per_request: 0.008,
    });

    useEffect(() => {
        fetchRecommendations();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [recommendations, filters]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/cost/recommendations');
            setRecommendations(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch recommendations');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...recommendations];

        if (filters.type !== 'all') {
            filtered = filtered.filter(r => r.type === filters.type);
        }

        if (filters.impact !== 'all') {
            filtered = filtered.filter(r => r.impact === filters.impact);
        }

        if (filters.effort !== 'all') {
            filtered = filtered.filter(r => r.effort === filters.effort);
        }

        setFilteredRecommendations(filtered);
    };

    const handleViewDetails = async (recommendation: Recommendation) => {
        setSelectedRecommendation(recommendation);
        try {
            if (recommendation.type === 'model_switch' || recommendation.type === 'provider_switch') {
                const res = await api.get(`/api/cost/recommendations/${recommendation.id}/comparison`);
                setComparison(res.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch comparison:', err);
        }
    };

    const handleApplyRecommendation = async (id: number) => {
        if (!confirm('Are you sure you want to apply this recommendation?')) {
            return;
        }

        try {
            await api.post(`/api/cost/recommendations/${id}/apply`);
            fetchRecommendations();
            setSelectedRecommendation(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to apply recommendation');
        }
    };

    const handleDismissRecommendation = async (id: number) => {
        try {
            await api.post(`/api/cost/recommendations/${id}/dismiss`);
            fetchRecommendations();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to dismiss recommendation');
        }
    };

    const calculateSavings = () => {
        const currentMonthly = savingsCalculator.monthly_requests * savingsCalculator.current_cost_per_request;
        const recommendedMonthly = savingsCalculator.monthly_requests * savingsCalculator.recommended_cost_per_request;
        const monthlySavings = currentMonthly - recommendedMonthly;
        const annualSavings = monthlySavings * 12;
        return { monthlySavings, annualSavings };
    };

    const getTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            model_switch: 'Model Switch',
            prompt_optimization: 'Prompt Optimization',
            provider_switch: 'Provider Switch',
            batch_processing: 'Batch Processing',
            caching: 'Caching',
        };
        return labels[type] || type;
    };

    const getImpactColor = (impact: string) => {
        const colors: { [key: string]: string } = {
            low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
        return colors[impact] || colors.low;
    };

    const getEffortColor = (effort: string) => {
        const colors: { [key: string]: string } = {
            low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[effort] || colors.low;
    };

    const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.potential_savings, 0);
    const savings = calculateSavings();

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Optimization Recommendations</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-powered suggestions to reduce costs</p>
                    </div>
                    <button
                        onClick={fetchRecommendations}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Refresh recommendations"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-primary-main to-primary-dark rounded-lg p-6 text-white">
                    <h2 className="text-lg font-semibold mb-2">Total Potential Savings</h2>
                    <p className="text-3xl font-bold">${totalPotentialSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm opacity-90 mt-1">{recommendations.length} recommendations available</p>
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

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Type
                            </label>
                            <select
                                id="filter-type"
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            >
                                <option value="all">All Types</option>
                                <option value="model_switch">Model Switch</option>
                                <option value="prompt_optimization">Prompt Optimization</option>
                                <option value="provider_switch">Provider Switch</option>
                                <option value="batch_processing">Batch Processing</option>
                                <option value="caching">Caching</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-impact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Impact
                            </label>
                            <select
                                id="filter-impact"
                                value={filters.impact}
                                onChange={(e) => setFilters({ ...filters, impact: e.target.value })}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            >
                                <option value="all">All Impact Levels</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-effort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Effort
                            </label>
                            <select
                                id="filter-effort"
                                value={filters.effort}
                                onChange={(e) => setFilters({ ...filters, effort: e.target.value })}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            >
                                <option value="all">All Effort Levels</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Recommendations Grid */}
                {!loading && filteredRecommendations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRecommendations.map(rec => (
                            <div
                                key={rec.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => handleViewDetails(rec)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded mb-2">
                                            {getTypeLabel(rec.type)}
                                        </span>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            {rec.title}
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                    {rec.description}
                                </p>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Potential Savings:</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            ${rec.potential_savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {rec.confidence}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(rec.impact)}`}>
                                        {rec.impact} impact
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffortColor(rec.effort)}`}>
                                        {rec.effort} effort
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDetails(rec);
                                        }}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-primary-main hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main rounded min-h-[44px] flex items-center justify-center"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDismissRecommendation(rec.id);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label={`Dismiss recommendation ${rec.id}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading recommendations...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredRecommendations.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No recommendations found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or check back later</p>
                    </div>
                )}

                {/* Savings Calculator */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Savings Calculator</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label htmlFor="monthly-requests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Monthly Requests
                            </label>
                            <input
                                type="number"
                                id="monthly-requests"
                                value={savingsCalculator.monthly_requests}
                                onChange={(e) => setSavingsCalculator({ ...savingsCalculator, monthly_requests: Number(e.target.value) })}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                min="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="current-cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Cost/Request ($)
                            </label>
                            <input
                                type="number"
                                id="current-cost"
                                value={savingsCalculator.current_cost_per_request}
                                onChange={(e) => setSavingsCalculator({ ...savingsCalculator, current_cost_per_request: Number(e.target.value) })}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                step="0.001"
                                min="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="recommended-cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Recommended Cost/Request ($)
                            </label>
                            <input
                                type="number"
                                id="recommended-cost"
                                value={savingsCalculator.recommended_cost_per_request}
                                onChange={(e) => setSavingsCalculator({ ...savingsCalculator, recommended_cost_per_request: Number(e.target.value) })}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                step="0.001"
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Savings</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ${savings.monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Annual Savings</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ${savings.annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendation Details Modal */}
                {selectedRecommendation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRecommendation(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedRecommendation.title}</h2>
                                <button
                                    onClick={() => {
                                        setSelectedRecommendation(null);
                                        setComparison(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">{selectedRecommendation.description}</p>
                                </div>

                                {comparison && (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Cost Comparison</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {comparison.current.provider} / {comparison.current.model}
                                                </p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    ${comparison.current.cost.toFixed(4)}/request
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recommended</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {comparison.recommended.provider} / {comparison.recommended.model}
                                                </p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    ${comparison.recommended.cost.toFixed(4)}/request
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Savings per request</p>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                ${comparison.savings.toFixed(4)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleApplyRecommendation(selectedRecommendation.id)}
                                        className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Apply Recommendation
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedRecommendation(null);
                                            setComparison(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
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


import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface ModelMapping {
    id: number;
    model_name: string;
    provider: string;
    equivalent_models: string[];
    capabilities: {
        max_tokens?: number;
        supports_streaming?: boolean;
        supports_functions?: boolean;
        context_window?: number;
    };
    pricing: {
        input_per_1k?: number;
        output_per_1k?: number;
    };
}

interface ResolvedModel {
    unified_name: string;
    provider: string;
    provider_model: string;
    capabilities: any;
    pricing: any;
}

export default function ModelAbstraction() {
    const [mappings, setMappings] = useState<ModelMapping[]>([]);
    const [resolvedModel, setResolvedModel] = useState<ResolvedModel | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [unifiedName, setUnifiedName] = useState('');
    const [preferredProvider, setPreferredProvider] = useState('');
    const [selectedMapping, setSelectedMapping] = useState<ModelMapping | null>(null);
    const [comparisonModels, setComparisonModels] = useState<string[]>([]);

    const availableProviders = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];
    const unifiedModelNames = ['smart-fast', 'smart-balanced', 'smart-quality', 'smart-cheap'];

    useEffect(() => {
        fetchMappings();
    }, []);

    const fetchMappings = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/multi-provider/models');
            setMappings(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Failed to fetch model mappings:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to load model mappings');
            // Set empty array instead of mock data to show proper error state
            setMappings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unifiedName) {
            setError('Please enter a unified model name');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const params: any = { unified_name: unifiedName };
            if (preferredProvider) {
                params.preferred_provider = preferredProvider;
            }
            const res = await api.post('/api/multi-provider/resolve-model', null, { params });
            setResolvedModel(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to resolve model');
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = (models: string[]) => {
        setComparisonModels(models);
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Model Abstraction</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unified model names across providers</p>
                    </div>
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

                {/* Model Resolver */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Resolve Model</h2>
                    <form onSubmit={handleResolve} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="unified-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Unified Model Name <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="unified-name"
                                    value={unifiedName}
                                    onChange={(e) => setUnifiedName(e.target.value)}
                                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                    required
                                >
                                    <option value="">Select unified model</option>
                                    {unifiedModelNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="preferred-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Preferred Provider (Optional)
                                </label>
                                <select
                                    id="preferred-provider"
                                    value={preferredProvider}
                                    onChange={(e) => setPreferredProvider(e.target.value)}
                                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                >
                                    <option value="">Any provider</option>
                                    {availableProviders.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || !unifiedName}
                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                            >
                                {loading ? 'Resolving...' : 'Resolve Model'}
                            </button>
                        </div>
                    </form>

                    {/* Resolved Model Result */}
                    {resolvedModel && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Resolved Model</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Unified Name:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{resolvedModel.unified_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Provider:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{resolvedModel.provider}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Provider Model:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{resolvedModel.provider_model}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Model Catalog */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Model Catalog</h2>
                    {!loading && mappings.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mappings.map(mapping => (
                                <div
                                    key={mapping.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => setSelectedMapping(mapping)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {mapping.model_name}
                                        </h3>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                                            {mapping.provider}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Equivalent Models:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {mapping.equivalent_models.slice(0, 3).map(model => (
                                                    <span
                                                        key={model}
                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                    >
                                                        {model}
                                                    </span>
                                                ))}
                                                {mapping.equivalent_models.length > 3 && (
                                                    <span className="text-xs text-gray-400">+{mapping.equivalent_models.length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                        {mapping.pricing && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Input:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    ${mapping.pricing.input_per_1k?.toFixed(4)}/1K
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && mappings.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading model catalog...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && mappings.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No model mappings found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Model mappings will appear here</p>
                        </div>
                    )}
                </div>

                {/* Model Details Modal */}
                {selectedMapping && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedMapping(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedMapping.model_name}</h2>
                                <button
                                    onClick={() => setSelectedMapping(null)}
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
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider</h3>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{selectedMapping.provider}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Equivalent Models</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMapping.equivalent_models.map(model => (
                                            <span
                                                key={model}
                                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            >
                                                {model}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capabilities</h3>
                                    <dl className="space-y-2 text-sm">
                                        {selectedMapping.capabilities.max_tokens && (
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500 dark:text-gray-400">Max Tokens:</dt>
                                                <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                    {selectedMapping.capabilities.max_tokens.toLocaleString()}
                                                </dd>
                                            </div>
                                        )}
                                        {selectedMapping.capabilities.context_window && (
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500 dark:text-gray-400">Context Window:</dt>
                                                <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                    {selectedMapping.capabilities.context_window.toLocaleString()}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">Streaming:</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                {selectedMapping.capabilities.supports_streaming ? 'Yes' : 'No'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">Functions:</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                {selectedMapping.capabilities.supports_functions ? 'Yes' : 'No'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                {selectedMapping.pricing && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing</h3>
                                        <dl className="space-y-2 text-sm">
                                            {selectedMapping.pricing.input_per_1k && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-500 dark:text-gray-400">Input (per 1K tokens):</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                        ${selectedMapping.pricing.input_per_1k.toFixed(4)}
                                                    </dd>
                                                </div>
                                            )}
                                            {selectedMapping.pricing.output_per_1k && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-500 dark:text-gray-400">Output (per 1K tokens):</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                        ${selectedMapping.pricing.output_per_1k.toFixed(4)}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}


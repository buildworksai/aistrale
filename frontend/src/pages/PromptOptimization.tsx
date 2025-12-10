import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Prompt {
    id: number;
    name: string;
    template: string;
    input_variables: string[];
    version: number;
}

interface OptimizationSuggestion {
    type: 'reduce_tokens' | 'improve_clarity' | 'add_context' | 'fix_grammar';
    description: string;
    original: string;
    suggested: string;
    estimated_savings?: number;
    confidence: number;
}

interface ABTestResult {
    prompt_id: number;
    variant: string;
    tokens: number;
    quality_score: number;
    cost: number;
}

export default function PromptOptimization() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [optimizedTemplate, setOptimizedTemplate] = useState('');
    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
    const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tokenCount, setTokenCount] = useState(0);
    const [testVariables, setTestVariables] = useState<{ [key: string]: string }>({});
    const [isABTestModalOpen, setIsABTestModalOpen] = useState(false);

    useEffect(() => {
        fetchPrompts();
    }, []);

    useEffect(() => {
        if (selectedPrompt) {
            calculateTokenCount(selectedPrompt.template);
            fetchSuggestions(selectedPrompt.id);
        }
    }, [selectedPrompt]);

    const fetchPrompts = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/prompts/');
            setPrompts(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch prompts');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async (promptId: number) => {
        try {
            // Assuming endpoint exists: GET /api/prompts/{id}/optimization-suggestions
            const res = await api.get(`/api/prompts/${promptId}/optimization-suggestions`);
            setSuggestions(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Failed to fetch suggestions:', err);
        }
    };

    const calculateTokenCount = (text: string) => {
        // Simple token estimation (rough approximation: 1 token ≈ 4 characters)
        const estimated = Math.ceil(text.length / 4);
        setTokenCount(estimated);
    };

    const handleOptimize = async () => {
        if (!selectedPrompt) return;

        try {
            setLoading(true);
            setError('');
            // Assuming endpoint exists: POST /api/prompts/{id}/optimize
            const res = await api.post(`/api/prompts/${selectedPrompt.id}/optimize`, {
                template: selectedPrompt.template,
            });
            setOptimizedTemplate(res.data.optimized_template);
            setSuggestions(res.data.suggestions || []);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to optimize prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
        if (!selectedPrompt) return;
        const updated = selectedPrompt.template.replace(suggestion.original, suggestion.suggested);
        setSelectedPrompt({ ...selectedPrompt, template: updated });
        calculateTokenCount(updated);
    };

    const handleRunABTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPrompt) return;

        try {
            setLoading(true);
            setError('');
            // Assuming endpoint exists: POST /api/prompts/{id}/ab-test
            const res = await api.post(`/api/prompts/${selectedPrompt.id}/ab-test`, {
                variants: [selectedPrompt.template, optimizedTemplate || selectedPrompt.template],
                test_variables: testVariables,
            });
            setAbTestResults(res.data.results || []);
            setIsABTestModalOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to run A/B test');
        } finally {
            setLoading(false);
        }
    };

    const renderPreview = (template: string) => {
        let preview = template;
        Object.entries(testVariables).forEach(([key, value]) => {
            preview = preview.replace(`{${key}}`, value || `{${key}}`);
        });
        return preview;
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prompt Optimization</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Optimize prompts for better performance and cost</p>
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

                {/* Prompt Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Prompt</h2>
                    <select
                        value={selectedPrompt?.id || ''}
                        onChange={(e) => {
                            const prompt = prompts.find(p => p.id === Number(e.target.value));
                            setSelectedPrompt(prompt || null);
                            setOptimizedTemplate('');
                            setSuggestions([]);
                            setAbTestResults([]);
                        }}
                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                    >
                        <option value="">Select a prompt to optimize</option>
                        {prompts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
                        ))}
                    </select>
                </div>

                {/* Editor and Preview */}
                {selectedPrompt && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Editor */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prompt Editor</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {tokenCount} tokens
                                    </span>
                                    <button
                                        onClick={handleOptimize}
                                        disabled={loading}
                                        className="px-3 py-2 text-sm font-medium text-primary-main hover:text-primary-dark bg-primary-main/10 hover:bg-primary-main/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px] disabled:opacity-50"
                                    >
                                        Optimize
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={selectedPrompt.template}
                                onChange={(e) => {
                                    setSelectedPrompt({ ...selectedPrompt, template: e.target.value });
                                    calculateTokenCount(e.target.value);
                                }}
                                rows={12}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main font-mono text-sm"
                                placeholder="Enter your prompt template..."
                            />
                            {selectedPrompt.input_variables.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Variables</h3>
                                    <div className="space-y-2">
                                        {selectedPrompt.input_variables.map(variable => (
                                            <div key={variable} className="flex items-center gap-2">
                                                <label className="text-sm text-gray-500 dark:text-gray-400 w-24">
                                                    {variable}:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={testVariables[variable] || ''}
                                                    onChange={(e) => setTestVariables({ ...testVariables, [variable]: e.target.value })}
                                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main text-sm min-h-[44px]"
                                                    placeholder={`Enter value for ${variable}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Preview</h2>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[200px]">
                                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                    {renderPreview(selectedPrompt.template)}
                                </p>
                            </div>
                            {optimizedTemplate && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Optimized Version</h3>
                                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                                        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                            {renderPreview(optimizedTemplate)}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Estimated savings: {Math.max(0, tokenCount - Math.ceil(optimizedTemplate.length / 4))} tokens
                                        </span>
                                        <button
                                            onClick={() => {
                                                setSelectedPrompt({ ...selectedPrompt, template: optimizedTemplate });
                                                setOptimizedTemplate('');
                                                calculateTokenCount(optimizedTemplate);
                                            }}
                                            className="text-xs text-primary-main hover:text-primary-dark font-medium"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Optimization Suggestions */}
                {suggestions.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Optimization Suggestions</h2>
                        <div className="space-y-4">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize mb-1">
                                                {suggestion.type.replace('_', ' ')}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.description}</p>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {(suggestion.confidence * 100).toFixed(0)}% confidence
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original:</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded p-2">
                                                {suggestion.original}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggested:</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-green-50 dark:bg-green-900/30 rounded p-2">
                                                {suggestion.suggested}
                                            </p>
                                        </div>
                                    </div>
                                    {suggestion.estimated_savings && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                            Estimated savings: {suggestion.estimated_savings} tokens
                                        </p>
                                    )}
                                    <button
                                        onClick={() => handleApplySuggestion(suggestion)}
                                        className="mt-3 px-3 py-2 text-sm font-medium text-primary-main hover:text-primary-dark bg-primary-main/10 hover:bg-primary-main/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Apply Suggestion
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* A/B Test Results */}
                {abTestResults.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">A/B Test Results</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {abTestResults.map((result, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Variant {index + 1}
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Tokens:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{result.tokens}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Quality Score:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {(result.quality_score * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                ${result.cost.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {selectedPrompt && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setIsABTestModalOpen(true)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                            >
                                Run A/B Test
                            </button>
                            <button
                                onClick={handleOptimize}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-primary-main hover:text-primary-dark bg-primary-main/10 hover:bg-primary-main/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px] disabled:opacity-50"
                            >
                                {loading ? 'Optimizing...' : 'Get Suggestions'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && !selectedPrompt && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading prompts...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && prompts.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No prompts found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Create prompts to start optimizing</p>
                    </div>
                )}

                {/* A/B Test Modal */}
                {isABTestModalOpen && selectedPrompt && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsABTestModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Run A/B Test</h2>
                                <button
                                    onClick={() => setIsABTestModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleRunABTest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Test Variants
                                    </label>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original:</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded p-2">
                                                {selectedPrompt.template.substring(0, 100)}...
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Optimized:</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-green-50 dark:bg-green-900/30 rounded p-2">
                                                {(optimizedTemplate || selectedPrompt.template).substring(0, 100)}...
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsABTestModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Running...' : 'Run Test'}
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


import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface RoutingRule {
    id: number;
    name: string;
    priority: number;
    conditions: {
        model?: string;
        prompt_length?: { min?: number; max?: number };
        cost_budget?: number;
        latency_requirement?: number;
    };
    target_provider: string;
    enabled: boolean;
}

interface TestResult {
    success: boolean;
    matched_rule: string | null;
    selected_provider: string;
    reason: string;
}

export default function SmartRouting() {
    const [rules, setRules] = useState<RoutingRule[]>([]);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);

    // Form state
    const [ruleName, setRuleName] = useState('');
    const [priority, setPriority] = useState(1);
    const [targetProvider, setTargetProvider] = useState('');
    const [modelFilter, setModelFilter] = useState('');
    const [minPromptLength, setMinPromptLength] = useState('');
    const [maxPromptLength, setMaxPromptLength] = useState('');
    const [costBudget, setCostBudget] = useState('');
    const [latencyRequirement, setLatencyRequirement] = useState('');
    const [enabled, setEnabled] = useState(true);

    // Test form state
    const [testModel, setTestModel] = useState('');
    const [testPrompt, setTestPrompt] = useState('');

    const availableProviders = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/multi-provider/routing');
            setRules(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch routing rules';
            setError(errorMsg);
            setRules([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleName || !targetProvider) {
            setError('Name and target provider are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const conditions: any = {};
            if (modelFilter) conditions.model = modelFilter;
            if (minPromptLength || maxPromptLength) {
                conditions.prompt_length = {};
                if (minPromptLength) conditions.prompt_length.min = Number(minPromptLength);
                if (maxPromptLength) conditions.prompt_length.max = Number(maxPromptLength);
            }
            if (costBudget) conditions.cost_budget = Number(costBudget);
            if (latencyRequirement) conditions.latency_requirement = Number(latencyRequirement);

            const rule = {
                name: ruleName,
                priority,
                conditions,
                target_provider: targetProvider,
                enabled,
            };
            
            const res = await api.post('/api/multi-provider/routing', rule);
            setRules([...rules, res.data].sort((a, b) => b.priority - a.priority));
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create routing rule');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this routing rule?')) {
            return;
        }

        try {
            await api.delete(`/api/multi-provider/routing/${id}`);
            setRules(rules.filter(r => r.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete routing rule');
        }
    };

    const handleTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testModel || !testPrompt) {
            setError('Model and prompt are required for testing');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await api.post('/api/multi-provider/routing/test', {
                model: testModel,
                prompt: testPrompt,
            });
            setTestResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to test routing');
            setTestResult({
                success: false,
                matched_rule: null,
                selected_provider: '',
                reason: err.response?.data?.detail || err.message || 'Test failed',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setRuleName('');
        setPriority(1);
        setTargetProvider('');
        setModelFilter('');
        setMinPromptLength('');
        setMaxPromptLength('');
        setCostBudget('');
        setLatencyRequirement('');
        setEnabled(true);
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Smart Routing</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure intelligent provider routing rules</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsTestModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            aria-label="Test routing"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Test Routing
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            aria-label="Create routing rule"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Rule
                        </button>
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

                {/* Priority Visualization */}
                {rules.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rule Priority</h2>
                        <div className="space-y-2">
                            {rules
                                .sort((a, b) => b.priority - a.priority)
                                .map((rule, index) => (
                                    <div
                                        key={rule.id}
                                        className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-main text-white flex items-center justify-center font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {rule.name}
                                                </h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Priority: {rule.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Routes to: <span className="font-medium capitalize">{rule.target_provider}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                rule.enabled
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}>
                                                {rule.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(rule.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                aria-label={`Delete rule ${rule.name}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Rules List */}
                {!loading && rules.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Routing Rules</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conditions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Provider</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {rules.map(rule => (
                                        <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {rule.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {rule.priority}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="space-y-1">
                                                    {rule.conditions.model && (
                                                        <div>Model: {rule.conditions.model}</div>
                                                    )}
                                                    {rule.conditions.prompt_length && (
                                                        <div>
                                                            Prompt: {rule.conditions.prompt_length.min || 0} - {rule.conditions.prompt_length.max || '∞'} chars
                                                        </div>
                                                    )}
                                                    {rule.conditions.cost_budget && (
                                                        <div>Budget: ${rule.conditions.cost_budget}</div>
                                                    )}
                                                    {rule.conditions.latency_requirement && (
                                                        <div>Latency: &lt;{rule.conditions.latency_requirement}ms</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                {rule.target_provider}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    rule.enabled
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                }`}>
                                                    {rule.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    aria-label={`Delete rule ${rule.name}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && rules.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading routing rules...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && rules.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No routing rules found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a rule to enable smart routing</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Rule
                        </button>
                    </div>
                )}

                {/* Create Rule Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Routing Rule</h2>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Rule Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="rule-name"
                                            value={ruleName}
                                            onChange={(e) => setRuleName(e.target.value)}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            placeholder="e.g., Fast Model Routing"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Priority (higher = evaluated first)
                                        </label>
                                        <input
                                            type="number"
                                            id="priority"
                                            value={priority}
                                            onChange={(e) => setPriority(Number(e.target.value))}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            min="1"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="target-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Target Provider <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="target-provider"
                                        value={targetProvider}
                                        onChange={(e) => setTargetProvider(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="">Select provider</option>
                                        {availableProviders.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Conditions (Optional)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="model-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Model Filter
                                            </label>
                                            <input
                                                type="text"
                                                id="model-filter"
                                                value={modelFilter}
                                                onChange={(e) => setModelFilter(e.target.value)}
                                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                                placeholder="e.g., gpt-*"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="cost-budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Cost Budget ($)
                                            </label>
                                            <input
                                                type="number"
                                                id="cost-budget"
                                                value={costBudget}
                                                onChange={(e) => setCostBudget(e.target.value)}
                                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                                step="0.0001"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="min-prompt-length" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Min Prompt Length
                                            </label>
                                            <input
                                                type="number"
                                                id="min-prompt-length"
                                                value={minPromptLength}
                                                onChange={(e) => setMinPromptLength(e.target.value)}
                                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="max-prompt-length" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Max Prompt Length
                                            </label>
                                            <input
                                                type="number"
                                                id="max-prompt-length"
                                                value={maxPromptLength}
                                                onChange={(e) => setMaxPromptLength(e.target.value)}
                                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="latency-requirement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Max Latency (ms)
                                            </label>
                                            <input
                                                type="number"
                                                id="latency-requirement"
                                                value={latencyRequirement}
                                                onChange={(e) => setLatencyRequirement(e.target.value)}
                                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => setEnabled(e.target.checked)}
                                            className="w-4 h-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Enable this rule</span>
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
                                        disabled={loading || !ruleName || !targetProvider}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Creating...' : 'Create Rule'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Test Modal */}
                {isTestModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsTestModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Test Routing</h2>
                                <button
                                    onClick={() => {
                                        setIsTestModalOpen(false);
                                        setTestModel('');
                                        setTestPrompt('');
                                        setTestResult(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleTest} className="space-y-4">
                                <div>
                                    <label htmlFor="test-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Model <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="test-model"
                                        value={testModel}
                                        onChange={(e) => setTestModel(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="e.g., gpt-3.5-turbo"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="test-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Prompt <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="test-prompt"
                                        value={testPrompt}
                                        onChange={(e) => setTestPrompt(e.target.value)}
                                        rows={4}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main"
                                        placeholder="Enter a test prompt..."
                                        required
                                    />
                                </div>

                                {testResult && (
                                    <div className={`rounded-lg p-4 ${
                                        testResult.success
                                            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                                    }`}>
                                        <p className={`text-sm font-medium mb-2 ${
                                            testResult.success
                                                ? 'text-green-800 dark:text-green-200'
                                                : 'text-red-800 dark:text-red-200'
                                        }`}>
                                            {testResult.success ? 'Routing successful' : 'Routing failed'}
                                        </p>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                            {testResult.matched_rule && (
                                                <p>Matched rule: {testResult.matched_rule}</p>
                                            )}
                                            {testResult.selected_provider && (
                                                <p>Selected provider: {testResult.selected_provider}</p>
                                            )}
                                            <p>Reason: {testResult.reason}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsTestModalOpen(false);
                                            setTestModel('');
                                            setTestPrompt('');
                                            setTestResult(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !testModel || !testPrompt}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Testing...' : 'Test Routing'}
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


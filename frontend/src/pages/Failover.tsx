import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface FailoverConfig {
    id: number;
    workspace_id: number;
    primary_provider: string;
    fallback_providers: string[];
    failover_conditions: {
        latency_ms?: number;
        error_rate?: number;
        retry_count?: number;
    };
    enabled: boolean;
}

interface FailoverHistory {
    id: number;
    config_id: number;
    timestamp: string;
    event_type: 'failover' | 'recovery' | 'test';
    from_provider: string;
    to_provider: string;
    reason: string;
    success: boolean;
}

interface TestResult {
    success: boolean;
    message: string;
    attempts: number;
    providers_tried: string[];
    final_provider?: string;
}

export default function Failover() {
    const [configs, setConfigs] = useState<FailoverConfig[]>([]);
    const [history, setHistory] = useState<FailoverHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<FailoverConfig | null>(null);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [testPrompt, setTestPrompt] = useState('');

    // Form state
    const [workspaceId, setWorkspaceId] = useState<number | ''>('');
    const [primaryProvider, setPrimaryProvider] = useState('');
    const [fallbackProviders, setFallbackProviders] = useState<string[]>([]);
    const [latencyThreshold, setLatencyThreshold] = useState(2000);
    const [errorRateThreshold, setErrorRateThreshold] = useState(0.1);
    const [retryCount, setRetryCount] = useState(2);
    const [enabled, setEnabled] = useState(true);

    const availableProviders = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];

    useEffect(() => {
        fetchConfigs();
        fetchHistory();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            setError('');
            // Assuming endpoint exists: GET /api/multi-provider/failover
            const res = await api.get('/api/multi-provider/failover');
            setConfigs(Array.isArray(res.data) ? res.data : [res.data]);
        } catch (err: any) {
            // If endpoint doesn't exist, use mock data for now
            setConfigs([
                {
                    id: 1,
                    workspace_id: 1,
                    primary_provider: 'openai',
                    fallback_providers: ['anthropic', 'groq'],
                    failover_conditions: {
                        latency_ms: 2000,
                        error_rate: 0.1,
                        retry_count: 2,
                    },
                    enabled: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            // Assuming endpoint exists: GET /api/multi-provider/failover/history
            const res = await api.get('/api/multi-provider/failover/history');
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            // Mock history for demo
            setHistory([
                {
                    id: 1,
                    config_id: 1,
                    timestamp: new Date().toISOString(),
                    event_type: 'failover',
                    from_provider: 'openai',
                    to_provider: 'anthropic',
                    reason: 'High latency (2500ms)',
                    success: true,
                },
            ]);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId || !primaryProvider) {
            setError('Workspace and primary provider are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const config = {
                workspace_id: workspaceId,
                primary_provider: primaryProvider,
                fallback_providers: fallbackProviders,
                failover_conditions: {
                    latency_ms: latencyThreshold,
                    error_rate: errorRateThreshold,
                    retry_count: retryCount,
                },
                enabled,
            };
            
            // Assuming endpoint exists: POST /api/multi-provider/failover
            const res = await api.post('/api/multi-provider/failover', config);
            setConfigs([...configs, res.data]);
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create failover config');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (config: FailoverConfig) => {
        try {
            setLoading(true);
            setError('');
            // Assuming endpoint exists: PUT /api/multi-provider/failover/{id}
            const res = await api.put(`/api/multi-provider/failover/${config.id}`, config);
            setConfigs(configs.map(c => c.id === config.id ? res.data : c));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to update failover config');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this failover configuration?')) {
            return;
        }

        try {
            // Assuming endpoint exists: DELETE /api/multi-provider/failover/{id}
            await api.delete(`/api/multi-provider/failover/${id}`);
            setConfigs(configs.filter(c => c.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete failover config');
        }
    };

    const handleTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConfig || !testPrompt) {
            setError('Please select a configuration and enter a test prompt');
            return;
        }

        try {
            setLoading(true);
            setError('');
            // Assuming endpoint exists: POST /api/multi-provider/failover/{id}/test
            const res = await api.post(`/api/multi-provider/failover/${selectedConfig.id}/test`, {
                prompt: testPrompt,
            });
            setTestResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to test failover');
            setTestResult({
                success: false,
                message: err.response?.data?.detail || err.message || 'Test failed',
                attempts: 0,
                providers_tried: [],
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleProvider = (provider: string) => {
        if (fallbackProviders.includes(provider)) {
            setFallbackProviders(fallbackProviders.filter(p => p !== provider));
        } else {
            setFallbackProviders([...fallbackProviders, provider]);
        }
    };

    const resetForm = () => {
        setWorkspaceId('');
        setPrimaryProvider('');
        setFallbackProviders([]);
        setLatencyThreshold(2000);
        setErrorRateThreshold(0.1);
        setRetryCount(2);
        setEnabled(true);
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'failover':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'recovery':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'test':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Failover Configuration</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure automatic provider failover chains</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create failover configuration"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Configuration
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

                {/* Failover Configurations */}
                {!loading && configs.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {configs.map(config => (
                            <div
                                key={config.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            Workspace {config.workspace_id}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                config.enabled
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}>
                                                {config.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedConfig(config);
                                                setIsTestModalOpen(true);
                                            }}
                                            className="text-primary-main hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                            aria-label={`Test configuration ${config.id}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(config.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                            aria-label={`Delete configuration ${config.id}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Failover Chain Visualization */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Failover Chain</h4>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-main text-white rounded-lg">
                                            <span className="text-sm font-medium">{config.primary_provider}</span>
                                            <span className="text-xs opacity-75">Primary</span>
                                        </div>
                                        {config.fallback_providers.map((provider, idx) => (
                                            <React.Fragment key={provider}>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg">
                                                    <span className="text-sm font-medium">{provider}</span>
                                                    <span className="text-xs opacity-75">Fallback {idx + 1}</span>
                                                </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                {/* Failover Conditions */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Latency Threshold:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {config.failover_conditions.latency_ms}ms
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Error Rate Threshold:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {(config.failover_conditions.error_rate || 0) * 100}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Retry Count:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {config.failover_conditions.retry_count}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.enabled}
                                            onChange={(e) => handleUpdate({ ...config, enabled: e.target.checked })}
                                            className="w-4 h-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Enable failover</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && configs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading failover configurations...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && configs.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No failover configurations</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a configuration to enable automatic failover</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Configuration
                        </button>
                    </div>
                )}

                {/* Failover History */}
                {history.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Failover History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">From</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {history.map(event => (
                                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                                                    {event.event_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                {event.from_provider}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                {event.to_provider}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {event.reason}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    event.success
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {event.success ? 'Success' : 'Failed'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create Configuration Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Failover Configuration</h2>
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
                                    <label htmlFor="workspace-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Workspace ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="workspace-id"
                                        value={workspaceId}
                                        onChange={(e) => setWorkspaceId(e.target.value ? Number(e.target.value) : '')}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="primary-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Primary Provider <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="primary-provider"
                                        value={primaryProvider}
                                        onChange={(e) => setPrimaryProvider(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="">Select primary provider</option>
                                        {availableProviders.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fallback Providers
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableProviders
                                            .filter(p => p !== primaryProvider)
                                            .map(provider => (
                                                <button
                                                    key={provider}
                                                    type="button"
                                                    onClick={() => toggleProvider(provider)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                                                        fallbackProviders.includes(provider)
                                                            ? 'bg-primary-main text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                                >
                                                    {provider}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="latency-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Latency Threshold (ms)
                                        </label>
                                        <input
                                            type="number"
                                            id="latency-threshold"
                                            value={latencyThreshold}
                                            onChange={(e) => setLatencyThreshold(Number(e.target.value))}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="error-rate-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Error Rate Threshold (%)
                                        </label>
                                        <input
                                            type="number"
                                            id="error-rate-threshold"
                                            value={errorRateThreshold * 100}
                                            onChange={(e) => setErrorRateThreshold(Number(e.target.value) / 100)}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            min="0"
                                            max="100"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="retry-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Retry Count
                                        </label>
                                        <input
                                            type="number"
                                            id="retry-count"
                                            value={retryCount}
                                            onChange={(e) => setRetryCount(Number(e.target.value))}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            min="1"
                                            max="5"
                                        />
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
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Enable this configuration</span>
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
                                        disabled={loading || !workspaceId || !primaryProvider}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Creating...' : 'Create Configuration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Test Modal */}
                {isTestModalOpen && selectedConfig && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsTestModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Test Failover</h2>
                                <button
                                    onClick={() => {
                                        setIsTestModalOpen(false);
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
                                    <label htmlFor="test-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Test Prompt <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="test-prompt"
                                        value={testPrompt}
                                        onChange={(e) => setTestPrompt(e.target.value)}
                                        rows={4}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main"
                                        placeholder="Enter a test prompt to simulate failover..."
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
                                            {testResult.message}
                                        </p>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                            <p>Attempts: {testResult.attempts}</p>
                                            <p>Providers tried: {testResult.providers_tried.join(', ')}</p>
                                            {testResult.final_provider && (
                                                <p>Final provider: {testResult.final_provider}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsTestModalOpen(false);
                                            setTestPrompt('');
                                            setTestResult(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !testPrompt}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Testing...' : 'Run Test'}
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


import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { reliabilityService } from '../lib/api/services';

interface CircuitBreaker {
    provider: string;
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    last_failure: string | null;
    recovery_timeout: number;
    is_blocking: boolean;
    failure_threshold: number;
    success_threshold: number;
}

interface CircuitBreakerHistory {
    id: number;
    provider: string;
    state: string;
    timestamp: string;
    reason: string;
}

export default function CircuitBreakers() {
    const [breakers, setBreakers] = useState<CircuitBreaker[]>([]);
    const [history, setHistory] = useState<CircuitBreakerHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // Config form state
    const [failureThreshold, setFailureThreshold] = useState(5);
    const [successThreshold, setSuccessThreshold] = useState(2);
    const [recoveryTimeout, setRecoveryTimeout] = useState(30);

    const availableProviders = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];

    useEffect(() => {
        fetchBreakers();
        fetchHistory();
        
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchBreakers();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const fetchBreakers = async () => {
        try {
            setLoading(true);
            setError('');
            const results: CircuitBreaker[] = [];

            await Promise.all(availableProviders.map(async (provider) => {
                try {
                    const data = await reliabilityService.getCircuitBreaker(provider);
                    results.push({
                        provider,
                        state: data.state,
                        failures: data.failures,
                        last_failure: data.last_failure || null,
                        recovery_timeout: data.recovery_timeout || 30,
                        is_blocking: data.is_blocking || false,
                        failure_threshold: 5,
                        success_threshold: 2,
                    });
                } catch (e) {
                    results.push({
                        provider,
                        state: 'closed',
                        failures: 0,
                        last_failure: null,
                        recovery_timeout: 30,
                        is_blocking: false,
                        failure_threshold: 5,
                        success_threshold: 2,
                    });
                }
            }));
            setBreakers(results);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch circuit breakers');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            // Assuming endpoint exists: GET /api/reliability/circuit-breakers/history
            const res = await api.get('/api/reliability/circuit-breakers/history');
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Failed to fetch history:', err);
        }
    };

    const handleSimulateFailure = async (provider: string) => {
        try {
            await reliabilityService.simulateFailure(provider);
            fetchBreakers();
            fetchHistory();
        } catch (err: any) {
            setError(err.message || 'Failed to simulate failure');
        }
    };

    const handleUpdateConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProvider) return;

        try {
            setLoading(true);
            setError('');
            // Assuming endpoint exists: PUT /api/reliability/circuit-breakers/{provider}/config
            await api.put(`/api/reliability/circuit-breakers/${selectedProvider}/config`, {
                failure_threshold: failureThreshold,
                success_threshold: successThreshold,
                recovery_timeout: recoveryTimeout,
            });
            setIsConfigModalOpen(false);
            setSelectedProvider(null);
            fetchBreakers();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to update configuration');
        } finally {
            setLoading(false);
        }
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case 'open':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
            case 'half-open':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
            case 'closed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600';
        }
    };

    const getStateDescription = (state: string) => {
        switch (state) {
            case 'open':
                return 'Circuit is open - requests are blocked';
            case 'half-open':
                return 'Circuit is half-open - testing recovery';
            case 'closed':
                return 'Circuit is closed - normal operation';
            default:
                return 'Unknown state';
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Circuit Breakers</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor and configure circuit breaker states</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh</span>
                    </label>
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

                {/* Circuit Breakers Grid */}
                {!loading && breakers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {breakers.map(cb => (
                            <div
                                key={cb.provider}
                                className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
                                    cb.state === 'open'
                                        ? 'border-red-300 dark:border-red-700'
                                        : cb.state === 'half-open'
                                        ? 'border-yellow-300 dark:border-yellow-700'
                                        : 'border-green-300 dark:border-green-700'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize mb-2">
                                            {cb.provider}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(cb.state)}`}>
                                            {cb.state}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {getStateDescription(cb.state)}
                                </p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Failures:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {cb.failures} / {cb.failure_threshold}
                                        </span>
                                    </div>
                                    {cb.last_failure && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Last Failure:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {new Date(cb.last_failure).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Recovery Timeout:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {cb.recovery_timeout}s
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => {
                                            setSelectedProvider(cb.provider);
                                            setFailureThreshold(cb.failure_threshold);
                                            setSuccessThreshold(cb.success_threshold);
                                            setRecoveryTimeout(cb.recovery_timeout);
                                            setIsConfigModalOpen(true);
                                        }}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Configure
                                    </button>
                                    <button
                                        onClick={() => handleSimulateFailure(cb.provider)}
                                        className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Test
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* State Visualization */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">State Diagram</h2>
                    <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${getStateColor('closed')} border-4`}>
                                <span className="text-sm font-semibold">CLOSED</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Normal</p>
                        </div>
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div className="text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${getStateColor('open')} border-4`}>
                                <span className="text-sm font-semibold">OPEN</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Blocked</p>
                        </div>
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div className="text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${getStateColor('half-open')} border-4`}>
                                <span className="text-xs font-semibold">HALF-OPEN</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Testing</p>
                        </div>
                    </div>
                </div>

                {/* History */}
                {history.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">State History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">State</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {history.slice(0, 20).map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                {item.provider}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(item.state)}`}>
                                                    {item.state}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {item.reason}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && breakers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading circuit breakers...</p>
                    </div>
                )}

                {/* Configuration Modal */}
                {isConfigModalOpen && selectedProvider && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsConfigModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                                    Configure {selectedProvider}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsConfigModalOpen(false);
                                        setSelectedProvider(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleUpdateConfig} className="space-y-4">
                                <div>
                                    <label htmlFor="failure-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Failure Threshold
                                    </label>
                                    <input
                                        type="number"
                                        id="failure-threshold"
                                        value={failureThreshold}
                                        onChange={(e) => setFailureThreshold(Number(e.target.value))}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        min="1"
                                        max="20"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Number of failures before opening circuit
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="success-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Success Threshold
                                    </label>
                                    <input
                                        type="number"
                                        id="success-threshold"
                                        value={successThreshold}
                                        onChange={(e) => setSuccessThreshold(Number(e.target.value))}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        min="1"
                                        max="10"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Number of successes to close circuit
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="recovery-timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Recovery Timeout (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        id="recovery-timeout"
                                        value={recoveryTimeout}
                                        onChange={(e) => setRecoveryTimeout(Number(e.target.value))}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        min="5"
                                        max="300"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Time before attempting recovery
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsConfigModalOpen(false);
                                            setSelectedProvider(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Saving...' : 'Save Configuration'}
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


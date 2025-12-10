import React, { useEffect, useState } from 'react';
import { reliabilityService } from '../lib/api/services';
import Layout from '../components/Layout';
import api from '../lib/api';

interface CircuitBreaker {
    provider: string;
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    last_failure: string | null;
    recovery_timeout: number;
    is_blocking: boolean;
}

interface Incident {
    id: number;
    provider: string;
    type: 'outage' | 'degradation' | 'recovery';
    severity: 'low' | 'medium' | 'high' | 'critical';
    start_time: string;
    end_time: string | null;
    description: string;
}

interface ReliabilityMetrics {
    uptime_percentage: number;
    avg_response_time: number;
    error_rate: number;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
}

export default function ReliabilityDashboard() {
    const [circuitData, setCircuitData] = useState<CircuitBreaker[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [metrics, setMetrics] = useState<ReliabilityMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        loadData();
        if (autoRefresh) {
            const interval = setInterval(loadData, 10000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            
            const providers = ['openai', 'anthropic', 'groq', 'gemini', 'huggingface'];
            const circuitResults: CircuitBreaker[] = [];

            await Promise.all(providers.map(async (p) => {
                try {
                    const data = await reliabilityService.getCircuitBreaker(p);
                    circuitResults.push({
                        provider: p,
                        state: data.state,
                        failures: data.failures,
                        last_failure: data.last_failure || null,
                        recovery_timeout: data.recovery_timeout || 30,
                        is_blocking: data.is_blocking || false,
                    });
                } catch (e) {
                    circuitResults.push({
                        provider: p,
                        state: 'closed',
                        failures: 0,
                        last_failure: null,
                        recovery_timeout: 30,
                        is_blocking: false,
                    });
                }
            }));
            setCircuitData(circuitResults);

            // Fetch incidents
            try {
                const incidentsRes = await api.get('/api/reliability/incidents');
                setIncidents(Array.isArray(incidentsRes.data) ? incidentsRes.data : []);
            } catch (e) {
                console.error('Failed to fetch incidents:', e);
            }

            // Fetch metrics
            try {
                const metricsRes = await api.get('/api/reliability/metrics');
                setMetrics(metricsRes.data);
            } catch (e) {
                console.error('Failed to fetch metrics:', e);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load reliability data');
        } finally {
            setLoading(false);
        }
    };

    const simulateFailure = async (provider: string) => {
        try {
            await reliabilityService.simulateFailure(provider);
            loadData();
        } catch (e: any) {
            setError(e.message || 'Failed to simulate failure');
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

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'low':
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reliability Dashboard</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor system reliability and performance</p>
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

                {/* Metrics */}
                {metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Uptime</h3>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.uptime_percentage.toFixed(2)}%</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Response Time</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.avg_response_time.toFixed(0)}ms</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Error Rate</h3>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{(metrics.error_rate * 100).toFixed(2)}%</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Requests</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.total_requests.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* Circuit Breakers */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Circuit Breakers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {circuitData.map(cb => (
                            <div
                                key={cb.provider}
                                className={`p-4 rounded-lg border-2 ${
                                    cb.state === 'open'
                                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                                        : cb.state === 'half-open'
                                        ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                                        : 'border-green-300 dark:border-green-700 bg-white dark:bg-gray-800'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                        {cb.provider}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(cb.state)}`}>
                                        {cb.state}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Failures:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{cb.failures}</span>
                                    </div>
                                    {cb.last_failure && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Last Failure:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {new Date(cb.last_failure).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Recovery Timeout:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{cb.recovery_timeout}s</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => simulateFailure(cb.provider)}
                                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                >
                                    Simulate Failure
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Incident Timeline */}
                {incidents.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Incident Timeline</h2>
                        <div className="space-y-4">
                            {incidents.slice(0, 10).map(incident => (
                                <div
                                    key={incident.id}
                                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2 bg-primary-main"></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                                {incident.provider}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                                                {incident.severity}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {incident.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{incident.description}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(incident.start_time).toLocaleString()}
                                            {incident.end_time && ` - ${new Date(incident.end_time).toLocaleString()}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={loadData}
                            className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            Refresh Data
                        </button>
                        <button
                            onClick={() => {
                                const provider = circuitData.find(cb => cb.state === 'open')?.provider;
                                if (provider) {
                                    simulateFailure(provider);
                                }
                            }}
                            className="px-4 py-3 text-sm font-medium text-white bg-primary-main rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            Test Recovery
                        </button>
                        <button
                            onClick={() => window.location.href = '/queue-management'}
                            className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            View Queue
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && circuitData.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading reliability data...</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}

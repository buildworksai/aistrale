import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface ProviderHealth {
    provider: string;
    status: 'healthy' | 'degraded' | 'down';
    avg_latency_ms: number;
    error_rate: number;
    uptime_percentage: number;
    last_check: string;
}

interface LatencyDataPoint {
    timestamp: string;
    latency: number;
}

interface Alert {
    id: number;
    provider: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
}

export default function ProviderHealth() {
    const [providers, setProviders] = useState<ProviderHealth[]>([]);
    const [latencyHistory, setLatencyHistory] = useState<{ [key: string]: LatencyDataPoint[] }>({});
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10); // seconds

    useEffect(() => {
        fetchHealth();
        fetchAlerts();
        
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchHealth();
                fetchAlerts();
            }, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval]);

    const fetchHealth = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/multi-provider/health');
            setProviders(res.data);
            
            // Update latency history
            const newHistory: { [key: string]: LatencyDataPoint[] } = {};
            res.data.forEach((p: ProviderHealth) => {
                if (!latencyHistory[p.provider]) {
                    newHistory[p.provider] = [];
                } else {
                    newHistory[p.provider] = [...latencyHistory[p.provider]];
                }
                newHistory[p.provider].push({
                    timestamp: new Date().toISOString(),
                    latency: p.avg_latency_ms,
                });
                // Keep only last 20 data points
                if (newHistory[p.provider].length > 20) {
                    newHistory[p.provider] = newHistory[p.provider].slice(-20);
                }
            });
            setLatencyHistory(newHistory);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch provider health');
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            // In a real app, this would be a separate endpoint
            const criticalProviders = providers.filter(p => p.status === 'down');
            const degradedProviders = providers.filter(p => p.status === 'degraded');
            
            const newAlerts: Alert[] = [];
            let alertId = 1;
            
            criticalProviders.forEach(p => {
                newAlerts.push({
                    id: alertId++,
                    provider: p.provider,
                    severity: 'critical',
                    message: `${p.provider} is currently down`,
                    timestamp: p.last_check,
                });
            });
            
            degradedProviders.forEach(p => {
                if (p.error_rate > 0.1) {
                    newAlerts.push({
                        id: alertId++,
                        provider: p.provider,
                        severity: 'high',
                        message: `${p.provider} has high error rate (${(p.error_rate * 100).toFixed(1)}%)`,
                        timestamp: p.last_check,
                    });
                }
                if (p.avg_latency_ms > 2000) {
                    newAlerts.push({
                        id: alertId++,
                        provider: p.provider,
                        severity: 'medium',
                        message: `${p.provider} has high latency (${p.avg_latency_ms.toFixed(0)}ms)`,
                        timestamp: p.last_check,
                    });
                }
            });
            
            setAlerts(newAlerts);
        } catch (err: any) {
            console.error('Failed to fetch alerts:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'degraded':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'down':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getHealthScore = (provider: ProviderHealth): number => {
        let score = 100;
        
        // Deduct points for status
        if (provider.status === 'down') score -= 50;
        else if (provider.status === 'degraded') score -= 20;
        
        // Deduct points for latency (penalize > 1000ms)
        if (provider.avg_latency_ms > 1000) {
            score -= Math.min(30, (provider.avg_latency_ms - 1000) / 50);
        }
        
        // Deduct points for error rate
        score -= provider.error_rate * 30;
        
        // Deduct points for uptime
        score -= (100 - provider.uptime_percentage) * 0.5;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
            case 'high':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
            case 'low':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600';
        }
    };

    const renderLatencyGraph = (provider: string) => {
        const data = latencyHistory[provider] || [];
        if (data.length === 0) return null;

        const validData = data.filter(d => d && typeof d.latency === 'number' && !isNaN(d.latency) && isFinite(d.latency));
        if (validData.length === 0) return null;

        const maxLatency = Math.max(...validData.map(d => d.latency), 1000);
        const width = 200;
        const height = 60;

        // Handle single data point case
        if (validData.length === 1) {
            const y = height - (validData[0].latency / maxLatency) * height;
            return (
                <svg width={width} height={height} className="overflow-visible">
                    <circle cx={width / 2} cy={y} r="3" fill="rgb(59, 130, 246)" />
                </svg>
            );
        }

        return (
            <svg width={width} height={height} className="overflow-visible">
                <polyline
                    points={validData.map((d, i) => {
                        const x = (i / (validData.length - 1)) * width;
                        const y = height - (d.latency / maxLatency) * height;
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="2"
                />
            </svg>
        );
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Provider Health</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor provider status, latency, and uptime</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh</span>
                        </label>
                        {autoRefresh && (
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main text-sm min-h-[44px]"
                                aria-label="Refresh interval"
                            >
                                <option value="5">5s</option>
                                <option value="10">10s</option>
                                <option value="30">30s</option>
                                <option value="60">1m</option>
                            </select>
                        )}
                        <button
                            onClick={fetchHealth}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px] disabled:opacity-50"
                            aria-label="Refresh health data"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
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

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Active Alerts</h2>
                        <div className="space-y-2">
                            {alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold capitalize">{alert.severity}</span>
                                                <span className="text-sm opacity-75">{alert.provider}</span>
                                            </div>
                                            <p className="text-sm">{alert.message}</p>
                                        </div>
                                        <span className="text-xs opacity-75 ml-4">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Provider Status Grid */}
                {!loading && providers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {providers.map(provider => {
                            const healthScore = getHealthScore(provider);
                            const isSelected = selectedProvider === provider.provider;
                            
                            return (
                                <div
                                    key={provider.provider}
                                    className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${
                                        isSelected
                                            ? 'border-primary-main shadow-lg'
                                            : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                                    } p-6 cursor-pointer transition-all`}
                                    onClick={() => setSelectedProvider(isSelected ? null : provider.provider)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize">
                                                {provider.provider}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                                                {provider.status}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{healthScore}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Health Score</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-gray-500 dark:text-gray-400">Latency</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {provider.avg_latency_ms.toFixed(0)}ms
                                                </span>
                                            </div>
                                            {renderLatencyGraph(provider.provider)}
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Error Rate</span>
                                            <span className={`font-medium ${
                                                provider.error_rate > 0.1
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : provider.error_rate > 0.05
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-gray-900 dark:text-gray-100'
                                            }`}>
                                                {(provider.error_rate * 100).toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {provider.uptime_percentage.toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                Last checked: {new Date(provider.last_check).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading State */}
                {loading && providers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading provider health...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && providers.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No providers configured</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add providers to start monitoring their health</p>
                    </div>
                )}

                {/* Detailed View for Selected Provider */}
                {selectedProvider && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                {selectedProvider} Details
                            </h2>
                            <button
                                onClick={() => setSelectedProvider(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Close details"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {(() => {
                            const provider = providers.find(p => p.provider === selectedProvider);
                            if (!provider) return null;

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Latency Trend</h3>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            {renderLatencyGraph(selectedProvider) || (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No latency data available</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Metrics</h3>
                                        <dl className="space-y-3">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">Average Latency</dt>
                                                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {provider.avg_latency_ms.toFixed(2)}ms
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">Error Rate</dt>
                                                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {(provider.error_rate * 100).toFixed(2)}%
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">Uptime</dt>
                                                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {provider.uptime_percentage.toFixed(2)}%
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">Status</dt>
                                                <dd>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                                                        {provider.status}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">Last Check</dt>
                                                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {new Date(provider.last_check).toLocaleString()}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </Layout>
    );
}


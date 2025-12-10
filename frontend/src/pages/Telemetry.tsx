import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface TelemetryItem {
    id: number;
    model: string;
    sdk: string;
    input_summary: string;
    execution_time_ms: number;
    status: string;
    timestamp: string;
    input_tokens?: number;
    output_tokens?: number;
    cost?: number;
}

interface CostAnalytics {
    total_cost: number;
    period: {
        start: string;
        end: string;
    };
    by_provider: Record<string, number>;
    by_model: Record<string, number>;
    by_time: Record<string, number>;
    record_count: number;
}

export default function Telemetry() {
    const [logs, setLogs] = useState<TelemetryItem[]>([]);
    const [costAnalytics, setCostAnalytics] = useState<CostAnalytics | null>(null);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<keyof TelemetryItem>('timestamp');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [activeTab, setActiveTab] = useState<'logs' | 'analytics'>('logs');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    
    // Analytics filters
    const [analyticsProvider, setAnalyticsProvider] = useState<string>('');
    const [analyticsGroupBy, setAnalyticsGroupBy] = useState<string>('day');
    const [analyticsStartDate, setAnalyticsStartDate] = useState<string>('');
    const [analyticsEndDate, setAnalyticsEndDate] = useState<string>('');

    useEffect(() => {
        const fetchLogs = async () => {
            const res = await api.get('/api/telemetry/');
            setLogs(res.data);
        };
        fetchLogs();
    }, []);

    useEffect(() => {
        if (activeTab === 'analytics') {
            fetchCostAnalytics();
        }
    }, [activeTab, analyticsProvider, analyticsGroupBy, analyticsStartDate, analyticsEndDate]);

    const fetchCostAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const params = new URLSearchParams();
            if (analyticsProvider) params.append('provider', analyticsProvider);
            if (analyticsGroupBy) params.append('group_by', analyticsGroupBy);
            if (analyticsStartDate) params.append('start_date', analyticsStartDate);
            if (analyticsEndDate) params.append('end_date', analyticsEndDate);
            
            const res = await api.get(`/api/telemetry/cost-analytics?${params.toString()}`);
            setCostAnalytics(res.data);
        } catch (err: any) {
            console.error('Failed to fetch cost analytics', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const filteredAndSortedLogs = useMemo(() => {
        const lowerSearch = search.toLowerCase().trim();

        const filtered = logs.filter((log) => {
            if (!lowerSearch) return true;
            return (
                log.model.toLowerCase().includes(lowerSearch) ||
                log.sdk.toLowerCase().includes(lowerSearch) ||
                log.status.toLowerCase().includes(lowerSearch) ||
                (log.input_summary || '').toLowerCase().includes(lowerSearch)
            );
        });

        const sorted = [...filtered].sort((a, b) => {
            let aVal: number | string = '';
            let bVal: number | string = '';

            if (sortField === 'timestamp') {
                aVal = new Date(a.timestamp).getTime();
                bVal = new Date(b.timestamp).getTime();
            } else {
                aVal = (a[sortField] as string | number) ?? '';
                bVal = (b[sortField] as string | number) ?? '';
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            return sortDirection === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });

        return sorted;
    }, [logs, search, sortField, sortDirection]);

    const handleSort = (field: keyof TelemetryItem) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection(field === 'timestamp' ? 'desc' : 'asc');
        }
    };

    // Sort icon component
    const SortIcon = ({ field }: { field: keyof TelemetryItem }) => {
        if (sortField !== field) {
            return (
                <svg
                    className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                </svg>
            );
        }
        return (
            <svg
                className={`w-3 h-3 transition-transform ${
                    sortDirection === 'asc'
                        ? 'text-primary-main dark:text-primary-light'
                        : 'text-primary-main dark:text-primary-light rotate-180'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                />
            </svg>
        );
    };

    // Get unique providers for filter
    const uniqueProviders = useMemo(() => {
        const providers = new Set(logs.map(log => log.sdk).filter(Boolean));
        return Array.from(providers).sort();
    }, [logs]);

    return (
        <Layout>
            <div className="space-y-3">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-4">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'logs'
                                    ? 'border-primary-main text-primary-main dark:text-primary-light'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Telemetry Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'analytics'
                                    ? 'border-primary-main text-primary-main dark:text-primary-light'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Cost Analytics
                        </button>
                    </nav>
                </div>

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Telemetry Logs</h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="hidden sm:inline">Click column headers to sort</span>
                                    <span className="sm:hidden">Tap headers to sort</span>
                                </div>
                            </div>
                            <div className="w-full sm:w-64">
                                <label className="sr-only" htmlFor="telemetry-search">
                                    Search logs
                                </label>
                                <input
                                    id="telemetry-search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by model, SDK, status, input..."
                                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary-main focus:ring-primary-main"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('timestamp')}
                                            title="Click to sort by timestamp"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Timestamp
                                                <SortIcon field="timestamp" />
                                            </span>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('sdk')}
                                            title="Click to sort by SDK"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                SDK
                                                <SortIcon field="sdk" />
                                            </span>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('model')}
                                            title="Click to sort by model"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Model
                                                <SortIcon field="model" />
                                            </span>
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Input
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('input_tokens')}
                                            title="Click to sort by input tokens"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Input Tokens
                                                <SortIcon field="input_tokens" />
                                            </span>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('output_tokens')}
                                            title="Click to sort by output tokens"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Output Tokens
                                                <SortIcon field="output_tokens" />
                                            </span>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('execution_time_ms')}
                                            title="Click to sort by duration"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Duration (ms)
                                                <SortIcon field="execution_time_ms" />
                                            </span>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('cost')}
                                            title="Click to sort by cost"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Cost ($)
                                                <SortIcon field="cost" />
                                            </span>
                                        </th>
                                        <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() => handleSort('status')}
                                            title="Click to sort by status"
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Status
                                                <SortIcon field="status" />
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredAndSortedLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.sdk}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.model}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={log.input_summary}>
                                                {log.input_summary}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.input_tokens !== null ? log.input_tokens : '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.output_tokens !== null ? log.output_tokens : '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.execution_time_ms.toFixed(2)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {log.cost !== null && log.cost !== undefined ? `$${log.cost.toFixed(4)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Cost Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-3">
                        {/* Filters */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Filters</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
                                    <select
                                        value={analyticsProvider}
                                        onChange={(e) => setAnalyticsProvider(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">All Providers</option>
                                        {uniqueProviders.map(provider => (
                                            <option key={provider} value={provider}>{provider}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
                                    <select
                                        value={analyticsGroupBy}
                                        onChange={(e) => setAnalyticsGroupBy(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="day">Day</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                        <option value="provider">Provider</option>
                                        <option value="model">Model</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={analyticsStartDate}
                                        onChange={(e) => setAnalyticsStartDate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={analyticsEndDate}
                                        onChange={(e) => setAnalyticsEndDate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Analytics Results */}
                        {analyticsLoading ? (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading analytics...</p>
                            </div>
                        ) : costAnalytics ? (
                            <div className="space-y-3">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                                                <p className="text-2xl font-bold text-primary-main mt-1">
                                                    ${costAnalytics.total_cost.toFixed(4)}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-primary-main/10 dark:bg-primary-light/20 rounded-lg">
                                                <svg className="w-6 h-6 text-primary-main dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Records</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                                    {costAnalytics.record_count}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Period</p>
                                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                                    {new Date(costAnalytics.period.start).toLocaleDateString()} - {new Date(costAnalytics.period.end).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {/* By Provider */}
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Cost by Provider</h4>
                                        <div className="space-y-2">
                                            {Object.entries(costAnalytics.by_provider).length > 0 ? (
                                                Object.entries(costAnalytics.by_provider)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([provider, cost]) => {
                                                        const percentage = costAnalytics.total_cost > 0 
                                                            ? (cost / costAnalytics.total_cost) * 100 
                                                            : 0;
                                                        return (
                                                            <div key={provider} className="space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{provider}</span>
                                                                    <span className="text-gray-900 dark:text-gray-100 font-semibold">${cost.toFixed(4)}</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                    <div
                                                                        className="bg-primary-main h-2 rounded-full transition-all"
                                                                        style={{ width: `${percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* By Model */}
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Cost by Model</h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {Object.entries(costAnalytics.by_model).length > 0 ? (
                                                Object.entries(costAnalytics.by_model)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([model, cost]) => {
                                                        const percentage = costAnalytics.total_cost > 0 
                                                            ? (cost / costAnalytics.total_cost) * 100 
                                                            : 0;
                                                        return (
                                                            <div key={model} className="space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[60%]" title={model}>{model}</span>
                                                                    <span className="text-gray-900 dark:text-gray-100 font-semibold">${cost.toFixed(4)}</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                    <div
                                                                        className="bg-info-main h-2 rounded-full transition-all"
                                                                        style={{ width: `${percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* By Time */}
                                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Cost Over Time</h4>
                                    <div className="space-y-2">
                                        {Object.entries(costAnalytics.by_time).length > 0 ? (
                                            Object.entries(costAnalytics.by_time)
                                                .sort(([a], [b]) => a.localeCompare(b))
                                                .map(([timeKey, cost]) => {
                                                    const percentage = costAnalytics.total_cost > 0 
                                                        ? (cost / costAnalytics.total_cost) * 100 
                                                        : 0;
                                                    return (
                                                        <div key={timeKey} className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-700 dark:text-gray-300 font-medium">{timeKey}</span>
                                                                <span className="text-gray-900 dark:text-gray-100 font-semibold">${cost.toFixed(4)}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-success-main h-2 rounded-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No analytics data</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Run some inferences to see cost analytics</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}

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
}

export default function Telemetry() {
    const [logs, setLogs] = useState<TelemetryItem[]>([]);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<keyof TelemetryItem>('timestamp');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const fetchLogs = async () => {
            const res = await api.get('/api/telemetry/');
            setLogs(res.data);
        };
        fetchLogs();
    }, []);

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
            // Neutral sort icon when not active
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
        // Active sort icon
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

    return (
        <Layout>
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
        </Layout>
    );
}

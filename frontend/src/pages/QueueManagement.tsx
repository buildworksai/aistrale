import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface QueueItem {
    id: number;
    request_data: { [key: string]: any };
    priority: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    processed_at: string | null;
}

interface QueueMetrics {
    total_pending: number;
    total_processing: number;
    total_completed: number;
    avg_wait_time: number;
    avg_processing_time: number;
    queue_depth: number;
}

export default function QueueManagement() {
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedPriority, setSelectedPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    useEffect(() => {
        fetchQueue();
        fetchMetrics();
        
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchQueue();
                fetchMetrics();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/reliability/queue');
            setQueueItems(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch queue';
            setError(errorMsg);
            setQueueItems([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchMetrics = async () => {
        try {
            const res = await api.get('/api/reliability/queue/metrics');
            setMetrics(res.data || {
                total_pending: 0,
                total_processing: 0,
                total_completed: 0,
                avg_wait_time: 0,
                avg_processing_time: 0,
                queue_depth: 0
            });
        } catch (err: any) {
            console.error('Failed to fetch metrics:', err);
            setMetrics({
                total_pending: 0,
                total_processing: 0,
                total_completed: 0,
                avg_wait_time: 0,
                avg_processing_time: 0,
                queue_depth: 0
            });
        }
    };

    const handleDequeue = async () => {
        try {
            setLoading(true);
            setError('');
            await api.get('/api/reliability/queue/next');
            fetchQueue();
            fetchMetrics();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to dequeue');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await api.post(`/api/reliability/queue/complete/${id}`);
            fetchQueue();
            fetchMetrics();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to complete request');
        }
    };

    const getPriorityLabel = (priority: number) => {
        if (priority <= 1) return { label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
        if (priority <= 3) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
        return { label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'pending':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const filteredItems = queueItems.filter(item => {
        if (selectedPriority === 'all') return true;
        const priority = getPriorityLabel(item.priority);
        return priority.label.toLowerCase() === selectedPriority;
    });

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Queue Management</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor and manage request queues</p>
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
                        <button
                            onClick={handleDequeue}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px] disabled:opacity-50"
                            aria-label="Dequeue next request"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Dequeue Next
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

                {/* Metrics */}
                {metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Queue Depth</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.queue_depth}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pending</h3>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.total_pending}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Processing</h3>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.total_processing}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completed</h3>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.total_completed}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Wait</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.avg_wait_time.toFixed(0)}ms</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Process</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.avg_processing_time.toFixed(0)}ms</p>
                        </div>
                    </div>
                )}

                {/* Queue Visualization */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Queue Status</h2>
                        <select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main text-sm min-h-[44px]"
                            aria-label="Filter by priority"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        {['High Priority', 'Medium Priority', 'Low Priority'].map((queueName, idx) => {
                            const priorityNum = idx === 0 ? 1 : idx === 1 ? 2 : 3;
                            const queueItems = filteredItems.filter(item => {
                                const p = getPriorityLabel(item.priority);
                                return p.label === queueName.split(' ')[0];
                            });
                            const pendingCount = queueItems.filter(item => item.status === 'pending').length;
                            const maxCount = Math.max(...queueItems.map(() => 1), 1);
                            const percentage = maxCount > 0 ? (pendingCount / maxCount) * 100 : 0;
                            
                            return (
                                <div key={queueName}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{queueName}</span>
                                        <span className="text-gray-500 dark:text-gray-400">{pendingCount} pending</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-primary-main h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Queue Items Table */}
                {filteredItems.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Queue Items</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredItems.map(item => {
                                        const priority = getPriorityLabel(item.priority);
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    #{item.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                                                        {priority.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                    {JSON.stringify(item.request_data).substring(0, 50)}...
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {item.status === 'processing' && (
                                                        <button
                                                            onClick={() => handleComplete(item.id)}
                                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                            aria-label={`Complete request ${item.id}`}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && queueItems.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading queue data...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredItems.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Queue is empty</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No requests in the queue</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}


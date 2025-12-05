import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';

interface TelemetryItem {
    id: number;
    status: string;
    timestamp: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalRequests: 0,
        successRate: 0,
        recentActivity: [] as TelemetryItem[]
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/telemetry/');
                const logs: TelemetryItem[] = res.data;
                const total = logs.length;
                const success = logs.filter(l => l.status === 'success').length;
                const rate = total > 0 ? (success / total) * 100 : 0;

                // Sort by timestamp descending (newest first) and take the first 5
                const sortedLogs = [...logs].sort((a, b) => {
                    const dateA = new Date(a.timestamp).getTime();
                    const dateB = new Date(b.timestamp).getTime();
                    return dateB - dateA; // Descending order (newest first)
                });

                setStats({
                    totalRequests: total,
                    successRate: Math.round(rate),
                    recentActivity: sortedLogs.slice(0, 10) // Most recent 10 items
                });
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <Layout>
            <div className="h-[calc(100vh-8rem)] flex flex-col max-w-7xl mx-auto">
                <div className="space-y-2 flex-shrink-0">
                    {/* Stats Grid - Mobile First */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* Quick Actions Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-primary-main/10 dark:bg-primary-light/20 rounded-lg">
                                <svg className="w-5 h-5 text-primary-main dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Start a new task or manage your credentials.</p>
                        <div className="flex flex-col gap-1.5">
                            <Link 
                                to="/inference" 
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-main text-white rounded-md font-medium hover:bg-primary-dark transition-colors text-xs sm:text-sm shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Run Inference
                            </Link>
                            <Link 
                                to="/tokens" 
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Manage Tokens
                            </Link>
                        </div>
                    </div>

                    {/* Total Requests Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Requests</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-primary-main">{stats.totalRequests}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">lifetime</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">All-time inference requests</p>
                        </div>
                    </div>

                    {/* Success Rate Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-1.5 rounded-lg ${stats.successRate >= 90 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                                <svg className={`w-5 h-5 ${stats.successRate >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Success Rate</h3>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl sm:text-3xl font-extrabold ${stats.successRate >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                {stats.successRate}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">of all requests</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                    className={`h-1.5 rounded-full transition-all ${stats.successRate >= 90 ? 'bg-green-600' : 'bg-yellow-600'}`}
                                    style={{ width: `${stats.successRate}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                {/* Recent Activity - Full Width */}
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col flex-1 min-h-0 mt-2">
                    <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-primary-main/10 dark:bg-primary-light/20 rounded">
                                <svg className="w-4 h-4 text-primary-main dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700 flex-1 min-h-0 overflow-y-auto">
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((log) => (
                                <div key={log.id} className="px-3 sm:px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1 rounded-full ${log.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                {log.status === 'success' ? (
                                                    <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Inference Request</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 sm:px-4 py-6 text-center">
                                <svg className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-xs text-gray-500 dark:text-gray-400">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

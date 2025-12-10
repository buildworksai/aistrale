import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';

interface TelemetryItem {
    id: number;
    status: string;
    timestamp: string;
    model?: string;
    sdk?: string;
    cost?: number;
}

interface User {
    id: number;
    email: string;
    role: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalRequests: 0,
        successRate: 0,
        totalCost: 0,
        recentActivity: [] as TelemetryItem[]
    });
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/api/auth/me');
            setCurrentUser(res.data);
        } catch (error) {
            console.error("Failed to fetch current user", error);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [telemetryRes, costRes] = await Promise.all([
                api.get('/api/telemetry/').catch(() => ({ data: [] })),
                api.get('/api/telemetry/cost-analytics').catch(() => ({ data: { total_cost: 0 } }))
            ]);
            
            const logs: TelemetryItem[] = telemetryRes.data || [];
            const total = logs.length;
            const success = logs.filter(l => l.status === 'success').length;
            const rate = total > 0 ? (success / total) * 100 : 0;
            const totalCost = costRes.data?.total_cost || 0;

            const sortedLogs = [...logs].sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                return dateB - dateA;
            });

            setStats({
                totalRequests: total,
                successRate: Math.round(rate),
                totalCost,
                recentActivity: sortedLogs.slice(0, 5)
            });
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Welcome Section */}
                {currentUser && (
                    <div className="bg-gradient-to-r from-primary-main to-primary-dark rounded-lg shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Welcome back, {currentUser.email.split('@')[0]}!</h2>
                                <p className="text-primary-light/90">Ready to build something amazing with AI?</p>
                            </div>
                            <div className="hidden sm:block">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                                    {currentUser.email.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Requests */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Requests</h3>
                        {loading ? (
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRequests}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All-time inference requests</p>
                    </div>

                    {/* Success Rate */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg ${stats.successRate >= 90 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                                <svg className={`w-6 h-6 ${stats.successRate >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Success Rate</h3>
                        {loading ? (
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                            <p className={`text-2xl font-bold ${stats.successRate >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                {stats.successRate}%
                            </p>
                        )}
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full transition-all ${stats.successRate >= 90 ? 'bg-green-600' : 'bg-yellow-600'}`}
                                style={{ width: `${stats.successRate}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Total Cost */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Cost</h3>
                        {loading ? (
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.totalCost.toFixed(4)}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lifetime spending</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-primary-main/10 dark:bg-primary-light/20 rounded-lg">
                                <svg className="w-6 h-6 text-primary-main dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quick Actions</h3>
                        <div className="flex flex-col gap-2 mt-2">
                            <Link 
                                to="/inference" 
                                className="text-xs px-3 py-1.5 bg-primary-main text-white rounded-md font-medium hover:bg-primary-dark transition-colors text-center"
                            >
                                Run Inference
                            </Link>
                            <Link 
                                to="/tokens" 
                                className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center"
                            >
                                Manage Tokens
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary-main/10 dark:bg-primary-light/20 rounded">
                                    <svg className="w-5 h-5 text-primary-main dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                            </div>
                            <Link 
                                to="/telemetry"
                                className="text-xs text-primary-main hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-main font-medium"
                            >
                                View All →
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <div className="p-6 text-center">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-main"></div>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading activity...</p>
                                </div>
                            ) : stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((log) => (
                                    <div key={log.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-full ${log.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                    {log.status === 'success' ? (
                                                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {log.model || 'Inference Request'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {log.sdk && `${log.sdk} • `}
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {log.cost !== undefined && log.cost > 0 && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        ${log.cost.toFixed(4)}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                                                    log.status === 'success'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center">
                                    <svg className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Quick Links</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            <Link 
                                to="/inference"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                            >
                                <div className="p-2 bg-primary-main/10 dark:bg-primary-light/20 rounded-lg group-hover:bg-primary-main/20 transition-colors">
                                    <svg className="w-5 h-5 text-primary-main dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Run Inference</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Interact with AI models</p>
                                </div>
                            </Link>
                            <Link 
                                to="/prompts"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Prompts</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage templates</p>
                                </div>
                            </Link>
                            <Link 
                                to="/tokens"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                            >
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Tokens</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">API credentials</p>
                                </div>
                            </Link>
                            <Link 
                                to="/telemetry"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                            >
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Analytics</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">View metrics</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

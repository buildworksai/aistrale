import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';

interface BudgetData {
    total_budget: number;
    spent: number;
    forecast: number;
    details: { category: string; allocated: number; spent: number }[];
}

interface CostAnalytics {
    total_cost: number;
    period: { start: string; end: string };
    by_provider: { [key: string]: number };
    by_model: { [key: string]: number };
    by_time: { [key: string]: number };
    record_count: number;
}

interface Recommendation {
    id: number;
    type: string;
    current_cost: number;
    potential_savings: number;
    confidence: number;
    action_items: { [key: string]: any };
    created_at: string;
}

interface Anomaly {
    date: string;
    type: string;
    severity: string;
    cost_delta: number;
    root_cause: string;
}

const CostDashboard: React.FC = () => {
    const [budget, setBudget] = useState<BudgetData | null>(null);
    const [analytics, setAnalytics] = useState<CostAnalytics | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Load budget
            try {
                const budgetRes = await api.get('/api/cost/budget');
                setBudget(budgetRes.data);
            } catch (e: any) {
                console.error('Failed to load budget:', e);
                setBudget({
                    total_budget: 0,
                    spent: 0,
                    forecast: 0,
                    details: []
                });
            }
            
            // Load cost analytics
            try {
                const analyticsRes = await api.get('/api/telemetry/cost-analytics');
                setAnalytics(analyticsRes.data);
            } catch (e: any) {
                console.error('Failed to load analytics:', e);
                setAnalytics(null);
            }
            
            // Load recommendations (top 5)
            try {
                const recRes = await api.get('/api/cost/recommendations?limit=5');
                setRecommendations(Array.isArray(recRes.data) ? recRes.data : []);
            } catch (e: any) {
                console.error('Failed to load recommendations:', e);
                setRecommendations([]);
            }
            
            // Load anomalies
            try {
                const anomaliesRes = await api.get('/api/cost/anomalies');
                setAnomalies(Array.isArray(anomaliesRes.data) ? anomaliesRes.data : []);
            } catch (e: any) {
                console.error('Failed to load anomalies:', e);
                setAnomalies([]);
            }
        } catch (e: any) {
            const errorMsg = e.response?.data?.detail || e.message || 'Failed to load cost data';
            setError(errorMsg);
            console.error('Failed to load cost data:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading cost analytics...</p>
                </div>
            </Layout>
        );
    }

    // Always render the dashboard, even if there are errors

    // Default values if budget is null
    const budgetData: BudgetData = budget || {
        total_budget: 0,
        spent: 0,
        forecast: 0,
        details: []
    };

    const percentUsed = budgetData.total_budget > 0 ? (budgetData.spent / budgetData.total_budget) * 100 : 0;
    const percentForecast = budgetData.total_budget > 0 ? (budgetData.forecast / budgetData.total_budget) * 100 : 0;

    return (
        <Layout>
            <div className="space-y-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cost Optimization Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor spending, budgets, and cost anomalies.</p>
                </header>

                {error && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Total Budget</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">${budgetData.total_budget.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Current Spend</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">${budgetData.spent.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{percentUsed.toFixed(1)}% of budget</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Forecasted Spend</h3>
                        <p className={`text-2xl font-bold mt-2 ${percentForecast > 100 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            ${budgetData.forecast.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{percentForecast.toFixed(1)}% of budget</p>
                    </div>
                </div>

                {/* Budget Progress */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Budget Utilization</h2>
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:text-blue-200 dark:bg-blue-900">
                                    Progress
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                                    {percentUsed.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-blue-200 dark:bg-blue-900/30">
                            <div style={{ width: `${Math.min(percentUsed, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                            {percentForecast > percentUsed && (
                                <div style={{ width: `${Math.min(percentForecast - percentUsed, 100 - percentUsed)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-300 dark:bg-blue-700 striped"></div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">* Light blue indicates forecasted usage for remainder of period</p>
                    </div>
                </section>

                {/* Breakdown Table */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Provider Breakdown</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allocated</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spent</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilization</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {budgetData.details.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No provider data available
                                        </td>
                                    </tr>
                                ) : (
                                    budgetData.details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${item.allocated.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${item.spent.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {item.allocated > 0 ? ((item.spent / item.allocated) * 100).toFixed(1) : '0.0'}%
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default CostDashboard;

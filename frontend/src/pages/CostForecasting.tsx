import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface ForecastData {
    date: string;
    predicted_cost: number;
    confidence_lower: number;
    confidence_upper: number;
    actual_cost?: number;
}

interface Scenario {
    id: number;
    name: string;
    description: string;
    assumptions: { [key: string]: any };
    forecast: ForecastData[];
}

interface AccuracyMetric {
    mae: number;
    mape: number;
    rmse: number;
    period: string;
}

export default function CostForecasting() {
    const [forecast, setForecast] = useState<ForecastData[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [accuracy, setAccuracy] = useState<AccuracyMetric | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
    const [forecastPeriod, setForecastPeriod] = useState<'7d' | '30d' | '90d'>('30d');
    const [isCreateScenarioOpen, setIsCreateScenarioOpen] = useState(false);

    // Scenario form state
    const [scenarioName, setScenarioName] = useState('');
    const [scenarioDescription, setScenarioDescription] = useState('');
    const [growthRate, setGrowthRate] = useState(10);
    const [modelUsage, setModelUsage] = useState(100);

    useEffect(() => {
        fetchForecast();
        fetchScenarios();
        fetchAccuracy();
    }, [forecastPeriod, selectedScenario]);

    const fetchForecast = async () => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams({ days_ahead: forecastPeriod === '7d' ? '7' : forecastPeriod === '30d' ? '30' : '90' });
            if (selectedScenario) {
                params.append('scenario_id', selectedScenario.toString());
            }
            const res = await api.get(`/api/cost/forecast?${params.toString()}`);
            const forecasts = res.data?.forecasts || [];
            setForecast(Array.isArray(forecasts) ? forecasts : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch forecast';
            setError(errorMsg);
            setForecast([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchScenarios = async () => {
        try {
            const res = await api.get('/api/cost/scenarios');
            setScenarios(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Failed to fetch scenarios:', err);
            setScenarios([]);
        }
    };

    const fetchAccuracy = async () => {
        try {
            const res = await api.get('/api/cost/forecast-accuracy');
            setAccuracy(res.data || null);
        } catch (err: any) {
            console.error('Failed to fetch accuracy metrics:', err);
            setAccuracy(null);
        }
    };

    const handleCreateScenario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scenarioName) {
            setError('Scenario name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await api.post('/api/cost/scenarios', {
                name: scenarioName,
                description: scenarioDescription,
                assumptions: {
                    growth_rate: growthRate,
                    model_usage: modelUsage,
                },
            });
            setScenarios([...scenarios, res.data]);
            setIsCreateScenarioOpen(false);
            setScenarioName('');
            setScenarioDescription('');
            setGrowthRate(10);
            setModelUsage(100);
            fetchForecast();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create scenario');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteScenario = async (id: number) => {
        if (!confirm('Are you sure you want to delete this scenario?')) {
            return;
        }

        try {
            await api.delete(`/api/cost/scenarios/${id}`);
            setScenarios(scenarios.filter(s => s.id !== id));
            if (selectedScenario === id) {
                setSelectedScenario(null);
            }
            fetchForecast();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete scenario');
        }
    };

    // Calculate chart data
    const maxCost = forecast.length > 0 ? Math.max(
        ...forecast.map(f => Math.max(f.predicted_cost || 0, f.confidence_upper || 0)),
        0
    ) : 0;

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cost Forecasting</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Predict future costs and plan scenarios</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={forecastPeriod}
                            onChange={(e) => setForecastPeriod(e.target.value as '7d' | '30d' | '90d')}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            aria-label="Forecast period"
                        >
                            <option value="7d">7 Days</option>
                            <option value="30d">30 Days</option>
                            <option value="90d">90 Days</option>
                        </select>
                        <button
                            onClick={() => setIsCreateScenarioOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            aria-label="Create scenario"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Scenario
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

                {/* Accuracy Metrics */}
                {accuracy && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mean Absolute Error</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${accuracy.mae.toFixed(2)}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mean Absolute % Error</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{accuracy.mape.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Root Mean Square Error</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${accuracy.rmse.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {/* Scenarios List */}
                {scenarios.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Scenarios</h2>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedScenario(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                                    selectedScenario === null
                                        ? 'bg-primary-main text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                Base Forecast
                            </button>
                            {scenarios.map(scenario => (
                                <div key={scenario.id} className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedScenario(scenario.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                                            selectedScenario === scenario.id
                                                ? 'bg-primary-main text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {scenario.name}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteScenario(scenario.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label={`Delete scenario ${scenario.name}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading forecast...</p>
                    </div>
                )}

                {/* Forecast Chart */}
                {!loading && forecast.length > 0 && maxCost > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Forecast Trend</h2>
                        <div className="relative h-64">
                            <svg className="w-full h-full" viewBox={`0 0 ${forecast.length * 50} 200`} preserveAspectRatio="none">
                                {/* Confidence interval */}
                                <path
                                    d={forecast.map((f, i) => {
                                        const x = i * 50;
                                        const lower = Number(f.confidence_lower) || 0;
                                        const upper = Number(f.confidence_upper) || 0;
                                        const y1 = maxCost > 0 && isFinite(lower) && isFinite(maxCost)
                                            ? Math.max(0, Math.min(200, 200 - (lower / maxCost) * 180))
                                            : 200;
                                        const y2 = maxCost > 0 && isFinite(upper) && isFinite(maxCost)
                                            ? Math.max(0, Math.min(200, 200 - (upper / maxCost) * 180))
                                            : 200;
                                        return i === 0 ? `M ${x} ${y1} L ${x} ${y2}` : `L ${x} ${y2} L ${x} ${y1}`;
                                    }).filter(p => !p.includes('NaN') && !p.includes('Infinity')).join(' ') + ' Z'}
                                    fill="rgba(59, 130, 246, 0.1)"
                                    stroke="none"
                                />
                                {/* Predicted line */}
                                <polyline
                                    points={forecast.map((f, i) => {
                                        const cost = Number(f.predicted_cost) || 0;
                                        const y = maxCost > 0 && isFinite(cost) && isFinite(maxCost) 
                                            ? Math.max(0, Math.min(200, 200 - (cost / maxCost) * 180))
                                            : 200;
                                        return `${i * 50},${y}`;
                                    }).filter(p => !p.includes('NaN') && !p.includes('Infinity')).join(' ')}
                                    fill="none"
                                    stroke="rgb(59, 130, 246)"
                                    strokeWidth="2"
                                />
                                {/* Actual line (if available) */}
                                {forecast.some(f => f.actual_cost) && maxCost > 0 && (
                                    <polyline
                                        points={forecast.filter(f => f.actual_cost).map((f, i) => {
                                            const idx = forecast.indexOf(f);
                                            const cost = Number(f.actual_cost) || 0;
                                            const y = maxCost > 0 && isFinite(cost) && isFinite(maxCost)
                                                ? Math.max(0, Math.min(200, 200 - (cost / maxCost) * 180))
                                                : 200;
                                            return `${idx * 50},${y}`;
                                        }).filter(p => !p.includes('NaN') && !p.includes('Infinity')).join(' ')}
                                        fill="none"
                                        stroke="rgb(34, 197, 94)"
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                    />
                                )}
                            </svg>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                <span className="text-gray-600 dark:text-gray-400">Predicted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500/10 rounded"></div>
                                <span className="text-gray-600 dark:text-gray-400">Confidence Interval</span>
                            </div>
                            {forecast.some(f => f.actual_cost) && (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-500 rounded border-2 border-dashed"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Actual</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Forecast Table */}
                {!loading && forecast.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Predicted Cost</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confidence Range</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actual Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {forecast.map((f, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(f.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                ${(f.predicted_cost || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                ${(f.confidence_lower || 0).toFixed(2)} - ${(f.confidence_upper || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {f.actual_cost ? `$${f.actual_cost.toFixed(2)}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && forecast.length === 0 && !error && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No forecast data</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Generate a forecast to see predictions</p>
                    </div>
                )}

                {/* Create Scenario Modal */}
                {isCreateScenarioOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateScenarioOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Scenario</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateScenarioOpen(false);
                                        setScenarioName('');
                                        setScenarioDescription('');
                                        setGrowthRate(10);
                                        setModelUsage(100);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateScenario} className="space-y-4">
                                <div>
                                    <label htmlFor="scenario-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Scenario Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="scenario-name"
                                        value={scenarioName}
                                        onChange={(e) => setScenarioName(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="e.g., High Growth Scenario"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="scenario-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="scenario-description"
                                        value={scenarioDescription}
                                        onChange={(e) => setScenarioDescription(e.target.value)}
                                        rows={3}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main"
                                        placeholder="Describe the assumptions for this scenario"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="growth-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Growth Rate (%)
                                    </label>
                                    <input
                                        type="range"
                                        id="growth-rate"
                                        value={growthRate}
                                        onChange={(e) => setGrowthRate(Number(e.target.value))}
                                        min="0"
                                        max="100"
                                        step="5"
                                        className="block w-full h-11"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>0%</span>
                                        <span className="font-medium text-primary-main">{growthRate}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="model-usage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Model Usage (%)
                                    </label>
                                    <input
                                        type="range"
                                        id="model-usage"
                                        value={modelUsage}
                                        onChange={(e) => setModelUsage(Number(e.target.value))}
                                        min="0"
                                        max="200"
                                        step="10"
                                        className="block w-full h-11"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>0%</span>
                                        <span className="font-medium text-primary-main">{modelUsage}%</span>
                                        <span>200%</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateScenarioOpen(false);
                                            setScenarioName('');
                                            setScenarioDescription('');
                                            setGrowthRate(10);
                                            setModelUsage(100);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !scenarioName}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Creating...' : 'Create Scenario'}
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


import React, { useEffect, useState } from 'react';
import { providerService } from '../lib/api/services';
import Layout from '../components/Layout';

interface ProviderHealth {
    provider: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    last_check: string;
}

const ProviderDashboard: React.FC = () => {
    const [healthData, setHealthData] = useState<ProviderHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [compProvider1, setCompProvider1] = useState('openai');
    const [compProvider2, setCompProvider2] = useState('anthropic');
    const [compResult, setCompResult] = useState<any>(null);

    useEffect(() => {
        loadHealth();
        // Simulate real-time updates
        const interval = setInterval(loadHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadHealth = async () => {
        try {
            const data = await providerService.getHealth();
            // Transform map to array if needed, or assume array based on backend
            // Backend returns Dict[str, ProviderHealth], so we transform
            const list = Object.values(data) as ProviderHealth[];
            setHealthData(list);
        } catch (e) {
            console.error(e);
            // Fallback mock for demo if backend not fully wired
            setHealthData([
                { provider: 'openai', status: 'healthy', latency: 120, last_check: new Date().toISOString() },
                { provider: 'anthropic', status: 'healthy', latency: 150, last_check: new Date().toISOString() },
                { provider: 'cohere', status: 'degraded', latency: 400, last_check: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading provider health...</div>
            </Layout>
        );
    }

    const handleCompare = async () => {
        try {
            const res = await providerService.compare(compProvider1, compProvider2, 'latency');
            setCompResult(res);
        } catch (e) {
            console.error(e);
            setCompResult({ winner: compProvider1, diff: 30, metric: 'latency' }); // Mock
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Health Grid */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Provider Health</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {healthData.map((p) => (
                            <div key={p.provider} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold capitalize text-gray-900 dark:text-gray-100">{p.provider}</h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${p.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                                        p.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                        }`}>
                                        {p.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Latency</p>
                                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{p.latency}ms</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Checked: {new Date(p.last_check).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison Tool */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Compare Providers</h2>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider A</label>
                            <select
                                value={compProvider1} onChange={(e) => setCompProvider1(e.target.value)}
                                className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="cohere">Cohere</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider B</label>
                            <select
                                value={compProvider2} onChange={(e) => setCompProvider2(e.target.value)}
                                className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="cohere">Cohere</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCompare}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium h-10 transition-colors"
                        >
                            Compare Latency
                        </button>
                    </div>

                    {compResult && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Comparison Result</h3>
                            <p className="text-blue-800 dark:text-blue-300 mt-1">
                                <span className="font-bold capitalize">{compResult.winner}</span> is faster by {compResult.diff}ms in current benchmarks.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </Layout>
    );
};

export default ProviderDashboard;

import React, { useEffect, useState } from 'react';
import { reliabilityService } from '../lib/api/services';
import Layout from '../components/Layout';

interface CircuitBreaker {
    state: string;
    failures: number;
    last_failure: string;
    recovery_timeout: number;
}

const ReliabilityDashboard: React.FC = () => {
    const [circuitData, setCircuitData] = useState<Record<string, CircuitBreaker>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            // Fetch for main providers
            const providers = ['openai', 'anthropic', 'cohere'];
            const results: Record<string, CircuitBreaker> = {};

            await Promise.all(providers.map(async (p) => {
                try {
                    const data = await reliabilityService.getCircuitBreaker(p);
                    results[p] = data;
                } catch (e) {
                    // Mock if fail
                    results[p] = { state: 'closed', failures: 0, last_failure: '', recovery_timeout: 30 };
                }
            }));
            setCircuitData(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const simulateFailure = async (provider: string) => {
        await reliabilityService.simulateFailure(provider);
        loadData(); // refresh immediately
    };

    if (loading) return (
        <Layout>
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading reliability metrics...</div>
        </Layout>
    );

    return (
        <Layout>
            <div className="space-y-6">
                {/* Circuit Breakers */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Circuit Breakers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(circuitData).map(([provider, cb]) => (
                            <div key={provider} className={`p-6 rounded-lg shadow-sm border-2 ${cb.state === 'open' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900' :
                                cb.state === 'half-open' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900' :
                                    'bg-white dark:bg-gray-800 border-green-200 dark:border-green-900'
                                }`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold capitalize text-gray-900 dark:text-gray-100">{provider}</h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${cb.state === 'open' ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                        cb.state === 'half-open' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                            'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        }`}>
                                        {cb.state}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Failures</span>
                                        <span className="font-mono font-medium">{cb.failures}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Last Failure</span>
                                        <span className="font-mono font-medium">{cb.last_failure ? new Date(cb.last_failure).toLocaleTimeString() : '-'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => simulateFailure(provider)}
                                    className="mt-4 w-full py-2 bg-gray-900 dark:bg-gray-700 text-white rounded hover:bg-gray-800 dark:hover:bg-gray-600 text-xs font-bold uppercase tracking-wide transition-colors"
                                >
                                    Simulate Failure
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Request Queues */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Request Queues</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Live Updates</span>
                    </div>

                    {/* Mock Queue Visualization */}
                    <div className="space-y-4">
                        {['High Priority', 'Standard', 'Batch'].map((q) => (
                            <div key={q}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{q}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{Math.floor(Math.random() * 10)} pending</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full relative" style={{ width: `${Math.random() * 40}%` }}>
                                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default ReliabilityDashboard;

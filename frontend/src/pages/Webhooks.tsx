import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Webhook {
    id: number;
    workspace_id: number;
    url: string;
    events: string[];
    secret: string;
    enabled: boolean;
    created_at: string;
}

interface WebhookDelivery {
    id: number;
    webhook_id: number;
    event_type: string;
    payload: { [key: string]: any };
    status: 'pending' | 'success' | 'failed';
    response_code: number | null;
    delivered_at: string | null;
    created_at: string;
}

interface WebhookAnalytics {
    total_deliveries: number;
    success_rate: number;
    avg_delivery_time: number;
    recent_failures: number;
}

export default function Webhooks() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [analytics, setAnalytics] = useState<WebhookAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
    const [testResult, setTestResult] = useState<any>(null);

    // Form state
    const [workspaceId, setWorkspaceId] = useState<number | ''>('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [secret, setSecret] = useState('');
    const [enabled, setEnabled] = useState(true);

    // Test form state
    const [testEventType, setTestEventType] = useState('inference.completed');
    const [testPayload, setTestPayload] = useState('{"test": "data"}');

    const availableEvents = [
        'inference.completed',
        'inference.failed',
        'cost.threshold_exceeded',
        'provider.failed',
        'prompt.updated',
        'token.added',
        'budget.exceeded',
        'failover.triggered',
    ];

    useEffect(() => {
        fetchWebhooks();
        fetchDeliveries();
        fetchAnalytics();
    }, []);

    const fetchWebhooks = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/webhooks/');
            setWebhooks(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch webhooks';
            setError(errorMsg);
            setWebhooks([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveries = async () => {
        try {
            const res = await api.get('/api/webhooks/deliveries');
            setDeliveries(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Failed to fetch deliveries:', err);
            setDeliveries([]);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/api/webhooks/analytics');
            setAnalytics(res.data || {
                total_deliveries: 0,
                success_rate: 0.0,
                avg_delivery_time: 0.0,
                recent_failures: 0
            });
        } catch (err: any) {
            console.error('Failed to fetch analytics:', err);
            setAnalytics({
                total_deliveries: 0,
                success_rate: 0.0,
                avg_delivery_time: 0.0,
                recent_failures: 0
            });
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId || !webhookUrl || selectedEvents.length === 0) {
            setError('Workspace, URL, and at least one event are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const webhook = {
                workspace_id: workspaceId,
                url: webhookUrl,
                events: selectedEvents,
                secret: secret || undefined,
                enabled,
            };
            
            // Assuming endpoint exists: POST /api/webhooks
            const res = await api.post('/api/webhooks', webhook);
            setWebhooks([...webhooks, res.data]);
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create webhook');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this webhook?')) {
            return;
        }

        try {
            // Assuming endpoint exists: DELETE /api/webhooks/{id}
            await api.delete(`/api/webhooks/${id}`);
            setWebhooks(webhooks.filter(w => w.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete webhook');
        }
    };

    const handleTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWebhook || !testEventType) {
            setError('Please select a webhook and event type');
            return;
        }

        try {
            setLoading(true);
            setError('');
            let payload;
            try {
                payload = JSON.parse(testPayload);
            } catch {
                payload = { test: 'data' };
            }

            const res = await api.post('/api/webhooks/dispatch-test', {
                workspace_id: selectedWebhook.workspace_id,
                event_type: testEventType,
                payload,
            });
            setTestResult(res.data);
            fetchDeliveries();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to test webhook');
            setTestResult({
                success: false,
                message: err.response?.data?.detail || err.message || 'Test failed',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleEvent = (event: string) => {
        if (selectedEvents.includes(event)) {
            setSelectedEvents(selectedEvents.filter(e => e !== event));
        } else {
            setSelectedEvents([...selectedEvents, event]);
        }
    };

    const resetForm = () => {
        setWorkspaceId('');
        setWebhookUrl('');
        setSelectedEvents([]);
        setSecret('');
        setEnabled(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Webhooks</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage webhook endpoints and monitor deliveries</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create webhook"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Webhook
                    </button>
                </div>

                {/* Analytics */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Deliveries</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.total_deliveries}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Success Rate</h3>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{(analytics.success_rate * 100).toFixed(1)}%</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Delivery Time</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.avg_delivery_time.toFixed(0)}ms</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Recent Failures</h3>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.recent_failures}</p>
                        </div>
                    </div>
                )}

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

                {/* Webhooks List */}
                {!loading && webhooks.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Webhook Endpoints</h2>
                        <div className="space-y-4">
                            {webhooks.map(webhook => (
                                <div
                                    key={webhook.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                    {webhook.url}
                                                </h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    webhook.enabled
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                }`}>
                                                    {webhook.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                Workspace {webhook.workspace_id} • Created {new Date(webhook.created_at).toLocaleDateString()}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {webhook.events.map(event => (
                                                    <span
                                                        key={event}
                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                    >
                                                        {event}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedWebhook(webhook);
                                                    setIsTestModalOpen(true);
                                                }}
                                                className="text-primary-main hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                aria-label={`Test webhook ${webhook.id}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(webhook.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                aria-label={`Delete webhook ${webhook.id}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && webhooks.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading webhooks...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && webhooks.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No webhooks configured</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a webhook to receive real-time event notifications</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Webhook
                        </button>
                    </div>
                )}

                {/* Delivery Log */}
                {deliveries.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delivery Log</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Response Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delivered At</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {deliveries.slice(0, 20).map(delivery => (
                                        <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(delivery.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {delivery.event_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                                    {delivery.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {delivery.response_code || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create Webhook Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Webhook</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label htmlFor="webhook-workspace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Workspace ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="webhook-workspace"
                                        value={workspaceId}
                                        onChange={(e) => setWorkspaceId(e.target.value ? Number(e.target.value) : '')}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Webhook URL <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        id="webhook-url"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="https://your-api.com/webhooks"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Events <span className="text-red-500">*</span> (Select at least one)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {availableEvents.map(event => (
                                            <button
                                                key={event}
                                                type="button"
                                                onClick={() => toggleEvent(event)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                                                    selectedEvents.includes(event)
                                                        ? 'bg-primary-main text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {event.split('.')[1] || event}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedEvents.length === 0 && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                            Please select at least one event
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="webhook-secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Secret (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="webhook-secret"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="Secret for signature verification"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Used to verify webhook authenticity
                                    </p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => setEnabled(e.target.checked)}
                                            className="w-4 h-4 text-primary-main focus:ring-primary-main border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Enable this webhook</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !workspaceId || !webhookUrl || selectedEvents.length === 0}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Creating...' : 'Create Webhook'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Test Modal */}
                {isTestModalOpen && selectedWebhook && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsTestModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Test Webhook</h2>
                                <button
                                    onClick={() => {
                                        setIsTestModalOpen(false);
                                        setTestEventType('inference.completed');
                                        setTestPayload('{"test": "data"}');
                                        setTestResult(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleTest} className="space-y-4">
                                <div>
                                    <label htmlFor="test-event-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Event Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="test-event-type"
                                        value={testEventType}
                                        onChange={(e) => setTestEventType(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        {availableEvents.map(event => (
                                            <option key={event} value={event}>{event}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="test-payload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Payload (JSON)
                                    </label>
                                    <textarea
                                        id="test-payload"
                                        value={testPayload}
                                        onChange={(e) => setTestPayload(e.target.value)}
                                        rows={6}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main font-mono text-sm"
                                        placeholder='{"test": "data"}'
                                    />
                                </div>

                                {testResult && (
                                    <div className={`rounded-lg p-4 ${
                                        testResult.success !== false
                                            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                                    }`}>
                                        <p className={`text-sm font-medium ${
                                            testResult.success !== false
                                                ? 'text-green-800 dark:text-green-200'
                                                : 'text-red-800 dark:text-red-200'
                                        }`}>
                                            {testResult.status === 'dispatched' ? 'Webhook dispatched successfully' : testResult.message || 'Test completed'}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsTestModalOpen(false);
                                            setTestEventType('inference.completed');
                                            setTestPayload('{"test": "data"}');
                                            setTestResult(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !testEventType}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {loading ? 'Testing...' : 'Send Test'}
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


import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface SecurityAuditEvent {
    id: number;
    event_type: string;
    description: string;
    user_id: number | null;
    ip_address: string | null;
    status: string;
    created_at: string;
    details: string | null;
}

export default function SecurityAudit() {
    const [events, setEvents] = useState<SecurityAuditEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    // Filters
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCurrentUser();
        fetchEvents();
    }, [eventTypeFilter, statusFilter]);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/api/auth/me');
            setCurrentUser(res.data);
        } catch (err) {
            console.error('Failed to fetch current user', err);
        }
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (eventTypeFilter) params.append('event_type', eventTypeFilter);
            if (statusFilter) params.append('status', statusFilter);
            
            const res = await api.get(`/api/security-audit/?${params.toString()}`);
            setEvents(res.data);
            setError('');
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You do not have permission to view security audit logs. Admin access required.');
            } else {
                setError(err.response?.data?.detail || err.message || 'Failed to fetch audit events');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            event.event_type.toLowerCase().includes(search) ||
            event.description.toLowerCase().includes(search) ||
            (event.ip_address || '').toLowerCase().includes(search) ||
            event.status.toLowerCase().includes(search)
        );
    });

    const uniqueEventTypes = Array.from(new Set(events.map(e => e.event_type))).sort();

    const getEventTypeColor = (eventType: string) => {
        if (eventType.includes('LOGIN')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        if (eventType.includes('TOKEN')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        if (eventType.includes('KEY')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        if (eventType.includes('INFERENCE')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    if (currentUser?.role !== 'admin') {
        return (
            <Layout>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-lg">Access Restricted</p>
                            <p className="mt-1">You need admin privileges to view security audit logs.</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security Audit Logs</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor security events and user activities</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Search</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search events..."
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Event Type</label>
                            <select
                                value={eventTypeFilter}
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">All Types</option>
                                {uniqueEventTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILURE">Failure</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Events Table */}
                {loading ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading audit events...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No audit events found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Security events will appear here as they occur</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP Address</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredEvents.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(event.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                                                    {event.event_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-md">
                                                {event.description}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {event.user_id || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                {event.ip_address || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    event.status === 'SUCCESS'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}


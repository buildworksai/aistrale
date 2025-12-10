import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Permission {
    id: number;
    user_id: number;
    resource_type: string;
    resource_id: string | null;
    action: string;
    granted: boolean;
}

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

const PERMISSION_TEMPLATES = [
    { name: 'Viewer', action: 'read', granted: true },
    { name: 'Editor', action: 'write', granted: true },
    { name: 'Admin', action: 'admin', granted: true },
    { name: 'No Access', action: 'read', granted: false },
];

const RESOURCE_TYPES = ['prompt', 'project', 'workspace', 'token', 'telemetry'];

export default function Permissions() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedResourceType, setSelectedResourceType] = useState<string>('');

    // Form state
    const [userId, setUserId] = useState<number | ''>('');
    const [resourceType, setResourceType] = useState('');
    const [resourceId, setResourceId] = useState('');
    const [action, setAction] = useState('read');
    const [granted, setGranted] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchPermissions();
        fetchUsers();
    }, [selectedUserId, selectedResourceType]);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            setError('');
            const params: any = {};
            if (selectedUserId) params.user_id = selectedUserId;
            if (selectedResourceType) params.resource_type = selectedResourceType;
            const res = await api.get('/api/permissions', { params });
            setPermissions(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch permissions');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !resourceType || !action) {
            setError('User, resource type, and action are required');
            return;
        }

        try {
            setCreating(true);
            setError('');
            await api.post('/api/permissions', {
                user_id: userId,
                resource_type: resourceType,
                resource_id: resourceId || null,
                action,
                granted,
            });
            setIsCreateModalOpen(false);
            setUserId('');
            setResourceType('');
            setResourceId('');
            setAction('read');
            setGranted(true);
            fetchPermissions();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create permission');
        } finally {
            setCreating(false);
        }
    };

    const handleBulkUpdate = async (template: typeof PERMISSION_TEMPLATES[0]) => {
        if (!selectedUserId || !selectedResourceType) {
            setError('Please select a user and resource type first');
            return;
        }

        if (!confirm(`Apply "${template.name}" template to selected user and resource type?`)) {
            return;
        }

        try {
            setLoading(true);
            setError('');
            await api.post('/api/permissions/bulk', {
                user_ids: [selectedUserId],
                resource_type: selectedResourceType,
                action: template.action,
                granted: template.granted,
            });
            fetchPermissions();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to apply template');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this permission? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/api/permissions/${id}`);
            fetchPermissions();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete permission');
        }
    };

    // Build permission matrix
    const matrixData: { [key: string]: { [key: string]: Permission | null } } = {};
    permissions.forEach(perm => {
        const key = `${perm.user_id}-${perm.resource_type}-${perm.resource_id || 'all'}`;
        if (!matrixData[key]) {
            matrixData[key] = {};
        }
        matrixData[key][perm.action] = perm;
    });

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Permissions</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage user permissions and access control</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create permission"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Permission
                    </button>
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

                {/* Filters and Templates */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="filter-user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Filter by User
                            </label>
                            <select
                                id="filter-user"
                                value={selectedUserId || ''}
                                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            >
                                <option value="">All Users</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-resource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Filter by Resource Type
                            </label>
                            <select
                                id="filter-resource"
                                value={selectedResourceType}
                                onChange={(e) => setSelectedResourceType(e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            >
                                <option value="">All Resource Types</option>
                                {RESOURCE_TYPES.map(rt => (
                                    <option key={rt} value={rt}>{rt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Permission Templates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quick Apply Templates
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PERMISSION_TEMPLATES.map(template => (
                                <button
                                    key={template.name}
                                    onClick={() => handleBulkUpdate(template)}
                                    disabled={!selectedUserId || !selectedResourceType}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Permission Matrix */}
                {!loading && permissions.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Resource
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Read
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Write
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Admin
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {permissions.map(perm => {
                                        const user = users.find(u => u.id === perm.user_id);
                                        return (
                                            <tr key={perm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {user ? `${user.name} (${user.email})` : `User ${perm.user_id}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {perm.resource_type}{perm.resource_id ? `: ${perm.resource_id}` : ' (all)'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {perm.action === 'read' && (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            perm.granted
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        }`}>
                                                            {perm.granted ? '✓' : '✗'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {perm.action === 'write' && (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            perm.granted
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        }`}>
                                                            {perm.granted ? '✓' : '✗'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {perm.action === 'admin' && (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            perm.granted
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        }`}>
                                                            {perm.granted ? '✓' : '✗'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleDelete(perm.id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                        aria-label={`Delete permission ${perm.id}`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && permissions.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No permissions found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first permission</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Permission
                        </button>
                    </div>
                )}

                {/* Create Permission Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Permission</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setUserId('');
                                        setResourceType('');
                                        setResourceId('');
                                        setAction('read');
                                        setGranted(true);
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
                                    <label htmlFor="perm-user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        User <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="perm-user"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="">Select a user</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="perm-resource-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Resource Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="perm-resource-type"
                                        value={resourceType}
                                        onChange={(e) => setResourceType(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="">Select resource type</option>
                                        {RESOURCE_TYPES.map(rt => (
                                            <option key={rt} value={rt}>{rt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="perm-resource-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Resource ID (optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="perm-resource-id"
                                        value={resourceId}
                                        onChange={(e) => setResourceId(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="Leave empty for all resources"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="perm-action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Action <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="perm-action"
                                        value={action}
                                        onChange={(e) => setAction(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="read">Read</option>
                                        <option value="write">Write</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="perm-granted"
                                        checked={granted}
                                        onChange={(e) => setGranted(e.target.checked)}
                                        className="w-5 h-5 text-primary-main border-gray-300 rounded focus:ring-primary-main"
                                    />
                                    <label htmlFor="perm-granted" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        Permission Granted
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setUserId('');
                                            setResourceType('');
                                            setResourceId('');
                                            setAction('read');
                                            setGranted(true);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !userId || !resourceType || !action}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {creating ? 'Creating...' : 'Create Permission'}
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


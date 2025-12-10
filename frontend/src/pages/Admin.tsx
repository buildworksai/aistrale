import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface EncryptionKey {
    id: number;
    key_id: string;
    encrypted_key: string;
    is_active: boolean;
    created_at: string;
    rotated_at: string | null;
}

export default function Admin() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeKey, setActiveKey] = useState<EncryptionKey | null>(null);
    const [loading, setLoading] = useState(false);
    const [rotating, setRotating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCurrentUser();
        fetchActiveKey();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/api/auth/me');
            setCurrentUser(res.data);
        } catch (err: any) {
            // User not authenticated - this is expected if not logged in
            if (err.response?.status === 401) {
                setCurrentUser(null);
            } else {
                console.error('Failed to fetch current user', err);
            }
        }
    };

    const fetchActiveKey = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/active-key');
            setActiveKey(res.data);
            setError('');
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You do not have permission to view encryption keys. Admin access required.');
            } else {
                setError(err.response?.data?.detail || err.message || 'Failed to fetch active key');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRotateKey = async () => {
        if (!confirm('Are you sure you want to rotate the encryption key? This will re-encrypt all tokens. This operation cannot be undone.')) {
            return;
        }

        try {
            setRotating(true);
            setError('');
            setSuccess('');

            const res = await api.post('/api/admin/rotate-encryption-key');

            setSuccess(`Encryption key rotated successfully! New key ID: ${res.data.new_key_id}, Re-encrypted ${res.data.re_encrypted_tokens_count} tokens.`);
            fetchActiveKey();
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You do not have permission to rotate encryption keys. Admin access required.');
            } else {
                setError(err.response?.data?.detail || err.message || 'Failed to rotate encryption key');
            }
        } finally {
            setRotating(false);
        }
    };

    // Show loading state while checking user
    if (currentUser === null && !error) {
        return (
            <Layout>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Administrative Controls</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage system-wide settings and security</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </Layout>
        );
    }

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
                            <p className="mt-1">
                                {currentUser
                                    ? 'You need admin privileges to access administrative controls.'
                                    : 'Please log in with an admin account to access administrative controls.'}
                            </p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Administrative Controls</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage system-wide settings and security</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium">Success</p>
                            <p className="text-sm mt-1">{success}</p>
                        </div>
                    </div>
                )}

                {/* Encryption Key Management */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Encryption Key Management</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage encryption keys for token security</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-main"></div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading key information...</p>
                            </div>
                        ) : activeKey ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key ID</label>
                                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 font-mono">
                                            {activeKey.key_id || activeKey.id}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                        <div className="px-3 py-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${activeKey.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                }`}>
                                                {activeKey.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created</label>
                                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100">
                                            {new Date(activeKey.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {activeKey.rotated_at && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rotated</label>
                                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(activeKey.rotated_at).toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Key Rotation</p>
                                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                Rotating the encryption key will generate a new key and re-encrypt all existing tokens.
                                                The old key will be deactivated but kept for historical purposes.
                                                This operation is automatically scheduled quarterly but can be triggered manually.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleRotateKey}
                                        disabled={rotating}
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-warning-main hover:bg-warning-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warning-main disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {rotating ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Rotating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Rotate Encryption Key
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No key information available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}


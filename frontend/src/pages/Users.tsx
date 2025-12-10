import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface User {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    useEffect(() => {
        fetchUsers();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/api/auth/me');
            setCurrentUser(res.data);
        } catch (err) {
            console.error('Failed to fetch current user', err);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/users/');
            setUsers(res.data);
            setError('');
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You do not have permission to view users. Admin access required.');
            } else {
                setError(err.response?.data?.detail || err.message || 'Failed to fetch users');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            await api.post('/api/users/', {
                email,
                password,
                role
            });
            
            setEmail('');
            setPassword('');
            setRole('user');
            setIsCreateModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You do not have permission to create users. Admin access required.');
            } else {
                setError(err.response?.data?.detail || err.message || 'Failed to create user');
            }
        }
    };

    return (
        <Layout>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">User Management</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Admin only - Manage platform users</p>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex justify-center py-1.5 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-main hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create User
                        </button>
                    )}
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

                {currentUser?.role !== 'admin' ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="font-medium">Access Restricted</p>
                                <p className="text-sm mt-1">You need admin privileges to access user management.</p>
                            </div>
                        </div>
                    </div>
                ) : loading && users.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first user to get started</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {user.email}
                                            {currentUser?.id === user.id && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    You
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                                                user.role === 'admin' 
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.is_active 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Create New User</h3>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setEmail('');
                                        setPassword('');
                                        setRole('user');
                                        setError('');
                                    }}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="user@example.com"
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Minimum 8 characters"
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Password must be at least 8 characters</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setEmail('');
                                            setPassword('');
                                            setRole('user');
                                            setError('');
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-main hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                                    >
                                        Create
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


import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Workspace {
    id: number;
    name: string;
    region: string;
    created_at: string;
}

export default function Workspaces() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRegion, setFilterRegion] = useState<string>('');

    // Form state
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const [creating, setCreating] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);

    const regions = [
        { value: 'us-east-1', label: 'US East 1' },
        { value: 'us-west-2', label: 'US West 2' },
        { value: 'eu-central-1', label: 'EU Central 1' },
        { value: 'eu-west-1', label: 'EU West 1' },
        { value: 'apac-se-1', label: 'APAC SE 1' },
    ];

    useEffect(() => {
        fetchWorkspaces();
        fetchDefaultRegion();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/workspaces');
            setWorkspaces(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch workspaces');
        } finally {
            setLoading(false);
        }
    };

    const fetchDefaultRegion = async () => {
        try {
            const res = await api.get('/api/regions/default');
            setRegion(res.data.code);
        } catch (err) {
            // Use default if API fails
            setRegion('us-east-1');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Workspace name is required');
            return;
        }

        try {
            setCreating(true);
            setError('');
            await api.post('/api/workspaces', { name, region: region || undefined });
            setIsCreateModalOpen(false);
            setName('');
            setRegion('');
            setWizardStep(1);
            fetchWorkspaces();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create workspace');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/api/workspaces/${id}`);
            fetchWorkspaces();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete workspace');
        }
    };

    const filteredWorkspaces = workspaces.filter(ws => {
        const matchesSearch = ws.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = !filterRegion || ws.region === filterRegion;
        return matchesSearch && matchesRegion;
    });

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workspaces</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your workspaces and organizations</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create workspace"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Workspace
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
                            aria-label="Dismiss error"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="search" className="sr-only">Search workspaces</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main"
                                    placeholder="Search workspaces..."
                                />
                            </div>
                        </div>
                        <div className="sm:w-48">
                            <label htmlFor="region-filter" className="sr-only">Filter by region</label>
                            <select
                                id="region-filter"
                                value={filterRegion}
                                onChange={(e) => setFilterRegion(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            >
                                <option value="">All Regions</option>
                                {regions.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading workspaces...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredWorkspaces.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {searchTerm || filterRegion ? 'No workspaces found' : 'No workspaces yet'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {searchTerm || filterRegion
                                ? 'Try adjusting your search or filters'
                                : 'Get started by creating your first workspace'}
                        </p>
                        {!searchTerm && !filterRegion && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Your First Workspace
                            </button>
                        )}
                    </div>
                )}

                {/* Workspaces Grid */}
                {!loading && filteredWorkspaces.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredWorkspaces.map(workspace => (
                            <div
                                key={workspace.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-primary-main focus-within:ring-offset-2"
                                tabIndex={0}
                                role="button"
                                aria-label={`Workspace: ${workspace.name}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            {workspace.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {regions.find(r => r.value === workspace.region)?.label || workspace.region}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(workspace.id);
                                        }}
                                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label={`Delete workspace ${workspace.name}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                    Created {new Date(workspace.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Workspace Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Workspace</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setName('');
                                        setRegion('');
                                        setWizardStep(1);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Wizard Steps Indicator */}
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <div className={`flex items-center ${wizardStep >= 1 ? 'text-primary-main' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${wizardStep >= 1 ? 'border-primary-main bg-primary-main text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {wizardStep > 1 ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span>1</span>
                                            )}
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Basic Info</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 mx-4 ${wizardStep >= 2 ? 'bg-primary-main' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className={`flex items-center ${wizardStep >= 2 ? 'text-primary-main' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${wizardStep >= 2 ? 'border-primary-main bg-primary-main text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {wizardStep > 2 ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span>2</span>
                                            )}
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Region</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 mx-4 ${wizardStep >= 3 ? 'bg-primary-main' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className={`flex items-center ${wizardStep >= 3 ? 'text-primary-main' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${wizardStep >= 3 ? 'border-primary-main bg-primary-main text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                            <span>3</span>
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Review</span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                {wizardStep === 1 && (
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Workspace Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            placeholder="My Workspace"
                                            required
                                            autoFocus
                                        />
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(2)}
                                                disabled={!name.trim()}
                                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div>
                                        <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Region
                                        </label>
                                        <select
                                            id="region"
                                            value={region}
                                            onChange={(e) => setRegion(e.target.value)}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        >
                                            {regions.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Select the region where your workspace data will be stored.
                                        </p>
                                        <div className="mt-4 flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(1)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(3)}
                                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Workspace Details</h3>
                                            <dl className="space-y-2">
                                                <div>
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Name</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-gray-100">{name}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Region</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-gray-100">
                                                        {regions.find(r => r.value === region)?.label || region}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                        <div className="flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(2)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={creating || !name.trim()}
                                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                            >
                                                {creating ? 'Creating...' : 'Create Workspace'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}


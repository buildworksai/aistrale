import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Region {
    code: string;
    name: string;
    is_allowed: boolean;
}

interface Workspace {
    id: number;
    name: string;
    region: string;
}

const REGIONS = [
    { code: 'us-east-1', name: 'US East 1', location: 'Virginia, USA' },
    { code: 'us-west-2', name: 'US West 2', location: 'Oregon, USA' },
    { code: 'eu-central-1', name: 'EU Central 1', location: 'Frankfurt, Germany' },
    { code: 'eu-west-1', name: 'EU West 1', location: 'Ireland' },
    { code: 'apac-se-1', name: 'APAC SE 1', location: 'Singapore' },
];

export default function DataResidency() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [configuring, setConfiguring] = useState(false);

    useEffect(() => {
        fetchRegions();
        fetchWorkspaces();
    }, []);

    const fetchRegions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/regions');
            setRegions(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch regions');
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkspaces = async () => {
        try {
            const res = await api.get('/api/workspaces');
            setWorkspaces(res.data);
        } catch (err: any) {
            console.error('Failed to fetch workspaces:', err);
        }
    };

    const handleRegionMigration = async (workspaceId: number, newRegion: string) => {
        if (!confirm(`Are you sure you want to migrate this workspace to ${newRegion}? This action may take some time.`)) {
            return;
        }

        try {
            setLoading(true);
            setError('');
            await api.patch(`/api/workspaces/${workspaceId}`, { region: newRegion });
            setSuccess(`Workspace migrated to ${newRegion} successfully`);
            fetchWorkspaces();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to migrate workspace');
        } finally {
            setLoading(false);
        }
    };

    const getRegionInfo = (code: string) => {
        return REGIONS.find(r => r.code === code) || { code, name: code, location: 'Unknown' };
    };

    const getWorkspacesByRegion = (regionCode: string) => {
        return workspaces.filter(w => w.region === regionCode);
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Residency</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage data storage regions and compliance</p>
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

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm flex-1">{success}</p>
                        <button
                            onClick={() => setSuccess('')}
                            className="text-green-500 hover:text-green-700 dark:hover:text-green-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Dismiss success"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Region Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {REGIONS.map(region => {
                        const regionData = regions.find(r => r.code === region.code);
                        const workspaceCount = getWorkspacesByRegion(region.code).length;
                        const isAllowed = regionData?.is_allowed ?? false;

                        return (
                            <div
                                key={region.code}
                                className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
                                    isAllowed
                                        ? 'border-green-200 dark:border-green-800'
                                        : 'border-gray-200 dark:border-gray-700 opacity-60'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            {region.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{region.location}</p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${isAllowed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                        <span className={`font-medium ${isAllowed ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                            {isAllowed ? 'Allowed' : 'Not Allowed'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Workspaces:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{workspaceCount}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Workspace Region Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Workspace Distribution by Region</h2>
                    {workspaces.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No workspaces found</p>
                    ) : (
                        <div className="space-y-4">
                            {REGIONS.map(region => {
                                const regionWorkspaces = getWorkspacesByRegion(region.code);
                                if (regionWorkspaces.length === 0) return null;

                                return (
                                    <div key={region.code} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                                {region.name} ({regionWorkspaces.length})
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                            {regionWorkspaces.map(workspace => (
                                                <div
                                                    key={workspace.id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                                >
                                                    <span className="text-sm text-gray-900 dark:text-gray-100">{workspace.name}</span>
                                                    <button
                                                        onClick={() => setIsConfigModalOpen(true)}
                                                        className="text-xs text-primary-main hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main rounded px-2 py-1 min-h-[32px]"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Region Migration Modal */}
                {isConfigModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsConfigModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Migrate Workspace</h2>
                                <button
                                    onClick={() => setIsConfigModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Select a region to migrate your workspace. This action may take some time.
                            </p>
                            <div className="space-y-2">
                                {REGIONS.map(region => (
                                    <button
                                        key={region.code}
                                        onClick={() => {
                                            setSelectedRegion(region.code);
                                            setIsConfigModalOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-colors min-h-[44px] ${
                                            selectedRegion === region.code
                                                ? 'border-primary-main bg-primary-main/10'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-primary-main/50'
                                        }`}
                                    >
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{region.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{region.location}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}


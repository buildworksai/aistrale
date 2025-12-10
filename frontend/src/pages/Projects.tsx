import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Project {
    id: number;
    name: string;
    workspace_id: number;
    created_at: string;
}

interface Workspace {
    id: number;
    name: string;
    region: string;
}

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState('');
    const [workspaceId, setWorkspaceId] = useState<number | ''>('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchWorkspaces();
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedWorkspaceId) {
            fetchProjects(selectedWorkspaceId);
        } else {
            fetchProjects();
        }
    }, [selectedWorkspaceId]);

    const fetchWorkspaces = async () => {
        try {
            const res = await api.get('/api/workspaces');
            setWorkspaces(res.data);
            if (res.data.length > 0 && !selectedWorkspaceId) {
                setSelectedWorkspaceId(res.data[0].id);
                setWorkspaceId(res.data[0].id);
            }
        } catch (err: any) {
            console.error('Failed to fetch workspaces:', err);
        }
    };

    const fetchProjects = async (workspaceId?: number) => {
        try {
            setLoading(true);
            setError('');
            const params = workspaceId ? { workspace_id: workspaceId } : {};
            const res = await api.get('/api/projects', { params });
            setProjects(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !workspaceId) {
            setError('Project name and workspace are required');
            return;
        }

        try {
            setCreating(true);
            setError('');
            await api.post('/api/projects', { name, workspace_id: workspaceId });
            setIsCreateModalOpen(false);
            setName('');
            fetchProjects(Number(workspaceId));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/api/projects/${id}`);
            fetchProjects(selectedWorkspaceId || undefined);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete project');
        }
    };

    const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

    return (
        <Layout>
            <div className="space-y-6">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
                    <button
                        onClick={() => navigate('/workspaces')}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-main rounded px-2 py-1 min-h-[44px]"
                    >
                        Workspaces
                    </button>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">Projects</span>
                </nav>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {selectedWorkspace ? `Projects in ${selectedWorkspace.name}` : 'Manage your projects'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {workspaces.length > 0 && (
                            <select
                                value={selectedWorkspaceId || ''}
                                onChange={(e) => {
                                    const wsId = e.target.value ? Number(e.target.value) : null;
                                    setSelectedWorkspaceId(wsId);
                                    setWorkspaceId(wsId || '');
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                            >
                                <option value="">All Workspaces</option>
                                {workspaces.map(ws => (
                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                ))}
                            </select>
                        )}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            disabled={workspaces.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                            aria-label="Create project"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Project
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

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading projects...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && projects.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {workspaces.length === 0 ? 'No workspaces available' : 'No projects yet'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {workspaces.length === 0
                                ? 'Create a workspace first to add projects'
                                : selectedWorkspace
                                ? `Get started by creating your first project in ${selectedWorkspace.name}`
                                : 'Get started by creating your first project'}
                        </p>
                        {workspaces.length > 0 && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Your First Project
                            </button>
                        )}
                    </div>
                )}

                {/* Projects Grid */}
                {!loading && projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map(project => {
                            const workspace = workspaces.find(w => w.id === project.workspace_id);
                            return (
                                <div
                                    key={project.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-primary-main focus-within:ring-offset-2"
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Project: ${project.name}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                {project.name}
                                            </h3>
                                            {workspace && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {workspace.name}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(project.id);
                                            }}
                                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                            aria-label={`Delete project ${project.name}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                        Created {new Date(project.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create Project Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Project</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setName('');
                                        setWorkspaceId('');
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
                                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Project Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="project-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="My Project"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="project-workspace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Workspace <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="project-workspace"
                                        value={workspaceId}
                                        onChange={(e) => setWorkspaceId(e.target.value ? Number(e.target.value) : '')}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="">Select a workspace</option>
                                        {workspaces.map(ws => (
                                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setName('');
                                            setWorkspaceId('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !name.trim() || !workspaceId}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {creating ? 'Creating...' : 'Create Project'}
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


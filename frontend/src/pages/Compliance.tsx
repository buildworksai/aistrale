import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

type ReportType = 'soc2' | 'gdpr' | 'hipaa';

export default function Compliance() {
    const [reportType, setReportType] = useState<ReportType>('soc2');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [gdprUserId, setGdprUserId] = useState('');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reportPreview, setReportPreview] = useState<any>(null);

    // Set default date range (last 30 days)
    React.useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    }, []);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            setError('Start date and end date are required');
            return;
        }

        if (reportType === 'gdpr' && !gdprUserId) {
            setError('User ID is required for GDPR reports');
            return;
        }

        try {
            setGenerating(true);
            setError('');
            setSuccess('');
            setReportPreview(null);

            if (reportType === 'soc2') {
                const response = await api.post(
                    '/api/compliance/soc2-report',
                    {
                        start_date: new Date(startDate).toISOString(),
                        end_date: new Date(endDate).toISOString(),
                    },
                    { responseType: 'blob' }
                );
                // Download CSV
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `soc2_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setSuccess('SOC 2 report generated and downloaded successfully');
            } else if (reportType === 'gdpr') {
                const response = await api.post('/api/compliance/gdpr-export', {
                    user_id: Number(gdprUserId),
                });
                setReportPreview(response.data);
                setSuccess('GDPR report generated successfully');
            } else if (reportType === 'hipaa') {
                const response = await api.post('/api/compliance/hipaa-report', {
                    start_date: new Date(startDate).toISOString(),
                    end_date: new Date(endDate).toISOString(),
                });
                setReportPreview(response.data);
                setSuccess('HIPAA report generated successfully');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPreview = () => {
        if (!reportPreview) return;
        const dataStr = JSON.stringify(reportPreview, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compliance Reporting</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate compliance reports for SOC 2, GDPR, and HIPAA</p>
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

                {/* Report Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report Configuration</h2>

                    {/* Report Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Report Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {(['soc2', 'gdpr', 'hipaa'] as ReportType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setReportType(type);
                                        setReportPreview(null);
                                        setSuccess('');
                                        setError('');
                                    }}
                                    className={`px-4 py-3 border-2 rounded-lg text-center transition-colors min-h-[44px] ${
                                        reportType === type
                                            ? 'border-primary-main bg-primary-main/10 text-primary-main dark:bg-primary-main/20'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-main/50'
                                    }`}
                                >
                                    <div className="font-medium uppercase">{type}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range (for SOC 2 and HIPAA) */}
                    {(reportType === 'soc2' || reportType === 'hipaa') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="start-date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    max={endDate}
                                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="end-date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* GDPR User ID */}
                    {reportType === 'gdpr' && (
                        <div className="mb-4">
                            <label htmlFor="gdpr-user-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                User ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="gdpr-user-id"
                                value={gdprUserId}
                                onChange={(e) => setGdprUserId(e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                placeholder="Enter user ID"
                                required
                            />
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerateReport}
                            disabled={generating || (reportType !== 'gdpr' && (!startDate || !endDate)) || (reportType === 'gdpr' && !gdprUserId)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                        >
                            {generating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Report Preview */}
                {reportPreview && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Report Preview</h2>
                            <button
                                onClick={handleDownloadPreview}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download JSON
                            </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                {JSON.stringify(reportPreview, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Compliance Status Dashboard */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Compliance Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">SOC 2</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">Compliant</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">GDPR</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">Compliant</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">HIPAA</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">Compliant</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}


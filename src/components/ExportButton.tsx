'use client';

import React, { useState } from 'react';
import { exportToCSV, exportToPDF } from '@/lib/export';

interface ExportButtonProps {
    data: Record<string, any>[];
    filename: string;
    pdfElementId?: string;
    pdfTitle?: string;
}

export default function ExportButton({ data, filename, pdfElementId, pdfTitle }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                className="export-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                📥 Export
            </button>

            {isOpen && (
                <div className="export-dropdown" onClick={() => setIsOpen(false)}>
                    <button
                        className="export-option"
                        onClick={() => exportToCSV(data, filename)}
                    >
                        <span>📄</span>
                        <div>
                            <div style={{ fontWeight: 600 }}>Export CSV</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Spreadsheet format
                            </div>
                        </div>
                    </button>
                    {pdfElementId && (
                        <button
                            className="export-option"
                            onClick={() => exportToPDF(pdfElementId, pdfTitle || filename)}
                        >
                            <span>📑</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>Export PDF</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Print-ready report
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

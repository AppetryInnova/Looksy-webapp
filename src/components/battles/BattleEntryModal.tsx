'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Scan {
    id: string;
    photoUrl: string;
    harmonyScore: number;
    createdAt: string;
}

interface BattleEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    battleId: string;
    onEntrySuccess: () => void;
}

export default function BattleEntryModal({ isOpen, onClose, battleId, onEntrySuccess }: BattleEntryModalProps) {
    const [mounted, setMounted] = useState(false);
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchScans();
        }
    }, [isOpen]);

    const fetchScans = async () => {
        setLoading(true);
        try {
            // Reusing the scans list endpoint (assuming /api/scans works for the current user)
            const res = await fetch('/api/scans');
            if (res.ok) {
                const data = await res.json();
                setScans(data);
            }
        } catch (error) {
            console.error('Failed to load scans', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedScanId || submitting) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/battles/${battleId}/enter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scanId: selectedScanId })
            });

            if (res.ok) {
                onEntrySuccess();
                onClose();
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Failed to enter battle');
            }
        } catch (error) {
            console.error('Error entering battle', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Submit Your Look</h2>
                <p>Select one of your recent scans to enter the battle.</p>
                
                {loading ? (
                    <div className="loading">Loading your scans...</div>
                ) : scans.length === 0 ? (
                    <div className="empty-state">
                        <p>You don't have any scans yet!</p>
                        <button className="btn-secondary" onClick={onClose}>Go to Scanner</button>
                    </div>
                ) : (
                    <div className="scans-grid">
                        {scans.map(scan => (
                            <div 
                                key={scan.id} 
                                className={`scan-card ${selectedScanId === scan.id ? 'selected' : ''}`}
                                onClick={() => setSelectedScanId(scan.id)}
                            >
                                <img src={scan.photoUrl} alt="Scan" />
                                <div className="score-label">{scan.harmonyScore}%</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="actions">
                    <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button 
                        className="btn-primary" 
                        onClick={handleSubmit} 
                        disabled={!selectedScanId || submitting}
                    >
                        {submitting ? 'Submitting...' : 'Enter Battle'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-content {
                    background: var(--color-surface);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: var(--radius-card);
                    padding: 24px;
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }
                h2 {
                    margin-top: 0;
                    margin-bottom: 8px;
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                p {
                    color: var(--color-text-dim);
                    margin-bottom: 20px;
                }
                .scans-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .scan-card {
                    position: relative;
                    aspect-ratio: 3/4;
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s;
                }
                .scan-card img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .scan-card.selected {
                    border-color: var(--color-primary);
                    transform: scale(0.95);
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
                }
                .score-label {
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }
                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .loading, .empty-state {
                    text-align: center;
                    padding: 40px 0;
                    color: var(--color-text-dim);
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}

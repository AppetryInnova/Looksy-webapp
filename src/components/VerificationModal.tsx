
import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import styles from './VerificationModal.module.css';
import logger from '@/lib/logger';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
}

export default function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
    const [step, setStep] = useState<'INTRO' | 'SCANNING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('INTRO');
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const t = useTranslations('Verification');

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
            setStep('INTRO');
            setProgress(0);
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            logger.error("Camera access denied or not available", err);
            // Fallback for demo/no-camera environments
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleStartScan = () => {
        setStep('SCANNING');
        let p = 0;
        const interval = setInterval(() => {
            p += 2;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                processVerification();
            }
        }, 50); // 2.5 seconds scan
    };

    const processVerification = async () => {
        setStep('PROCESSING');

        try {
            // Capture frame
            if (!videoRef.current) throw new Error("No video stream");

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("No canvas context");

            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Call API with real image data
            const res = await fetch('/api/profile/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    biometricData: dataUrl // Sending real base64 image
                })
            });

            const data = await res.json();

            if (res.ok) {
                setTimeout(() => {
                    setStep('SUCCESS');
                    setTimeout(() => {
                        onSuccess(data.user);
                        onClose();
                    }, 2000);
                }, 1500); // Fake processing delay
            } else {
                setStep('ERROR');
            }

        } catch (e) {
            setStep('ERROR');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeButton}>✕</button>

                {step === 'INTRO' && (
                    <div className={styles.content}>
                        <div className={styles.iconWrapper}>
                            <span className={styles.icon}>🛡️</span>
                        </div>
                        <h2 className={styles.title}>{t('title')}</h2>
                        <p className={styles.description}>
                            {t('description')}
                        </p>
                        <div className={styles.featureList}>
                            <div className={styles.feature}>
                                <span>✨</span>
                                <div>
                                    <strong>{t('badgeTitle')}</strong>
                                    <p>{t('badgeDesc')}</p>
                                </div>
                            </div>
                            <div className={styles.feature}>
                                <span>🔒</span>
                                <div>
                                    <strong>{t('securityTitle')}</strong>
                                    <p>{t('securityDesc')}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleStartScan} className={styles.primaryButton}>
                            {t('startScan')}
                        </button>
                    </div>
                )}

                {(step === 'SCANNING' || step === 'PROCESSING') && (
                    <div className={styles.scannerContainer}>
                        <div className={styles.videoWrapper}>
                            <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
                            <div className={styles.faceOverlay}>
                                <div className={styles.scanLine}></div>
                                <div className={styles.cornerTL}></div>
                                <div className={styles.cornerTR}></div>
                                <div className={styles.cornerBL}></div>
                                <div className={styles.cornerBR}></div>
                            </div>
                        </div>
                        <p className={styles.statusText}>
                            {step === 'SCANNING' ? t('scanning') : t('processing')}
                        </p>
                        <div className={styles.progressBarWrapper}>
                            <div className={styles.progressBarFill} style={{ width: `${step === 'PROCESSING' ? 100 : progress}%` }}></div>
                        </div>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className={styles.content}>
                        <div className={styles.successIcon}>✅</div>
                        <h2 className={styles.title}>{t('successTitle')}</h2>
                        <p className={styles.description}>{t('successDesc')}</p>
                    </div>
                )}

                {step === 'ERROR' && (
                    <div className={styles.content}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h2 className={styles.title}>{t('errorTitle')}</h2>
                        <p className={styles.description}>{t('errorDesc')}</p>
                        <button onClick={() => setStep('INTRO')} className={styles.secondaryButton}>{t('retry')}</button>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';
import GamificationModal from './GamificationModal';
import ShareModal from '@/components/ShareModal';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './Scanner.module.css';
import logger from '@/lib/logger';
import { showToast } from '@/components/Toast';
import posthog from 'posthog-js';
import imageCompression from 'browser-image-compression';

// Interfaces for API data
interface WardrobeItem {
    id: string;
    imageUrl: string;
    category: string;
    name?: string;
}

interface Store {
    id: string;
    name: string;
    location: string;
    items?: { imageUrl: string; name: string }[];
}

export default function Scanner() {
    const { data: session } = useSession();
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Battle State
    const [activeBattle, setActiveBattle] = useState<any>(null);
    const [joiningBattle, setJoiningBattle] = useState(false);
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const t = useTranslations('Scanner');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const [mode, setMode] = useState<'OUTFIT' | 'HAIRSTYLE' | 'MAKEUP'>('OUTFIT');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string, message: string, type: 'points' | 'level-up' | 'badge', imageUrl?: string }>({ title: '', message: '', type: 'points' });
    const [limitInfo, setLimitInfo] = useState<any>(null);
    const [pendingScanId, setPendingScanId] = useState<string | null>(null);

    // Data state
    const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [fullProfile, setFullProfile] = useState<any>(null);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch wardrobe items
                const itemsRes = await fetch('/api/items');
                if (itemsRes.ok) {
                    const items = await itemsRes.json();
                    setWardrobeItems(items);
                }

                // Fetch stores
                const storesRes = await fetch('/api/stores');
                if (storesRes.ok) {
                    const storesData = await storesRes.json();
                    setStores(storesData);
                }

                // Fetch full profile (for facial context)
                const profileRes = await fetch('/api/profile');
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setFullProfile(profileData);
                }

                // Fetch active battles
                const battlesRes = await fetch('/api/battles?limit=1');
                if (battlesRes.ok) {
                    const battles = await battlesRes.json();
                    if (battles.length > 0) {
                        setActiveBattle(battles[0]);
                    }
                }
            } catch (error) {
                logger.error("Error fetching background data:", error);
            }
        };

        if (session?.user) {
            fetchData();
        }
    }, [session]);

    // Realtime Listener for Background Analysis
    useEffect(() => {
        if (!pendingScanId) return;

        logger.info(`Listening for realtime updates on scan: ${pendingScanId}`);
        const channel = supabase
            .channel(`scan-status-${pendingScanId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'Scan',
                    filter: `id=eq.${pendingScanId}`,
                },
                (payload) => {
                    logger.debug('Realtime Update Received:', payload.new);
                    if (payload.new.status === 'COMPLETED') {
                        setResult({
                            ...payload.new,
                            feedback: payload.new.aiFeedback // Map DB field to UI field
                        });
                        setAnalyzing(false);
                        setPendingScanId(null);
                        showToast(t('scanSaved'), 'success');
                    } else if (payload.new.status === 'FAILED') {
                        showToast(t('errorAnalyzing'), 'error');
                        setAnalyzing(false);
                        setPendingScanId(null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pendingScanId, t]);

    const handleJoinBattle = async () => {
        if (!activeBattle || !result || !session?.user) return;
        setJoiningBattle(true);

        try {
            let scanIdToUse = null;

            const formData = new FormData();
            if (file) formData.append('file', file);

            // Upload image
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url: photoUrl } = await uploadRes.json();

            // Save scan
            const saveRes = await fetch('/api/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoUrl,
                    aiFeedback: `[BATTLE ENTRY] [${mode}] ${result.feedback}`,
                    harmonyScore: result.harmonyScore
                })
            });

            if (!saveRes.ok) throw new Error('Failed to save scan for battle');
            const savedData = await saveRes.json();
            scanIdToUse = savedData.scan.id;

            // Join Battle
            const joinRes = await fetch(`/api/battles/${activeBattle.id}/enter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    scanId: scanIdToUse
                })
            });

            if (joinRes.ok) {
                showToast(t('battleJoined', { title: activeBattle.title }), 'success');
                router.push(`/${locale}/battles`);
            } else {
                const err = await joinRes.json();
                showToast(err.error || t('battleError'), 'error');
            }

        } catch (error) {
            logger.error(error);
            showToast(t('battleError'), 'error');
        } finally {
            setJoiningBattle(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        let finalFile = selectedFile;
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            finalFile = await imageCompression(selectedFile, options);
        } catch (error) {
            logger.error('Compression failed in scanner', error);
        }

        setFile(finalFile);
        const imageUrl = URL.createObjectURL(finalFile);
        setImage(imageUrl);
        setResult(null);
    };

    const startAnalysis = async () => {
        if (!file) return;

        try {
            // First check if user has hit their limit gracefully
            const limitRes = await fetch('/api/analyze/limit');
            const limitData = await limitRes.json();

            if (limitData.limitReached) {
                setLimitInfo(limitData);
                posthog.capture('rate_limit_reached', {
                    limit: limitData.limit,
                    location: 'pre_analysis'
                });
                return;
            }
        } catch (e) {
            logger.error('Error checking limit:', e);
        }

        setAnalyzing(true);
        posthog.capture('analysis_started', { mode });

        try {
            // Get location context if possible
            let locationContext = "";
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                locationContext = `${position.coords.latitude},${position.coords.longitude}`;
            } catch (e) {
                logger.warn("Location permission denied or error");
            }

            // 1. Upload first to get a URL for the background job
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url: photoUrl } = await uploadRes.json();

            // 2. Start Background Analysis
            const scanRes = await fetch('/api/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoUrl,
                    isAsync: true,
                    mode,
                    locale,
                    location: locationContext,
                    facialProfile: fullProfile?.facialProfile || ''
                })
            });

            if (!scanRes.ok) throw new Error('Failed to initiate background analysis');
            const { scan } = await scanRes.json();
            
            setPendingScanId(scan.id);
            // We stay in 'analyzing' state until Realtime update or timeout
        } catch (error: any) {
            logger.error(error);
            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                setLimitInfo({ limitReached: true, limit: 10, isEarlyAdopter: true });
                setAnalyzing(false);
                posthog.capture('rate_limit_reached', {
                    limit: 10,
                    location: 'server_action'
                });
            } else {
                showToast(t('errorAnalyzing'), 'error');
                setAnalyzing(false);
                posthog.capture('analysis_failed', { error: error.message });
            }
        }


    };

    const handleSave = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!file || !result || !session?.user?.email) return;
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url: photoUrl } = await uploadRes.json();

            const saveRes = await fetch('/api/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoUrl,
                    aiFeedback: `[${mode}] ${result.feedback}\n\n[Tags: ${result.category}, ${result.style}, ${result.occasion}]`,
                    harmonyScore: result.harmonyScore
                })
            });

            if (saveRes.ok) {
                const data = await saveRes.json();
                if (data.newBadges && data.newBadges.length > 0) {
                    setModalConfig({ title: t('badgeUnlocked'), message: t('unlockedBadge', { badges: data.newBadges.join(', '), points: data.pointsAwarded }), type: 'badge' });
                } else if (data.newLevel && data.newLevel !== 'New Face') {
                    setModalConfig({ title: t('levelUp', { level: data.newLevel }), message: t('levelReached', { points: data.pointsAwarded }), type: 'level-up' });
                } else {
                    setModalConfig({ title: t('pointsAwarded', { points: data.pointsAwarded }), message: t('scanSaved'), type: 'points' });
                }
                setModalOpen(true);
                posthog.capture('scan_saved', {
                    scanId: data.scan.id,
                    mode,
                    harmonyScore: result.harmonyScore
                });
            }

        } catch (error) {
            logger.error('Error saving:', error);
            showToast(t('saveError'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // Helper to get a random item logic
    const handleWardrobeMatch = () => {
        let match = null;
        if (wardrobeItems.length > 0) {
            match = wardrobeItems[Math.floor(Math.random() * wardrobeItems.length)];
        }

        const itemName = match?.name || match?.category || t('basicItem');
        const itemImage = match?.imageUrl || '/placeholders/jeans.svg';

        setModalConfig({
            title: t('combineTitle'),
            message: match
                ? t('matchSuccess', { item: itemName })
                : t('matchFail'),
            type: 'points',
            imageUrl: itemImage
        });
        setModalOpen(true);
    };

    return (
        <div className={styles.container}>
            {/* Background Ambience */}
            <div className={`${styles.ambientBlob} ${styles.blobPrimary}`} />
            <div className={`${styles.ambientBlob} ${styles.blobSecondary}`} />

            <GamificationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} imageUrl={modalConfig.imageUrl} />

            <div className={styles.contentWrapper}>
                {!image && (
                    <div className={styles.initialState}>
                        <div className={styles.titleSection}>
                            <h2 className={styles.mainTitle}>Looksy AI</h2>
                            <p className={styles.subtitle}>{t('v2Title')}</p>
                        </div>

                        <label htmlFor="camera-input" className={styles.cameraButtonLabel}>
                            <div className={styles.cameraButton}>
                                <div className={styles.cameraButtonInner}>
                                    <span className={styles.cameraIcon}>📷</span>
                                </div>
                            </div>
                        </label>

                        <p className={styles.instructionText}>
                            {t('instruction', { mode: mode.toLowerCase() })}
                        </p>

                        <input id="camera-input" type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                )}

                {image && (
                    <>
                        {/* Preview Section */}
                        <div className={`${styles.previewContainer} ${result ? styles.hasResult : ''}`}>
                            <button
                                onClick={() => { setImage(null); setResult(null); setFile(null); }}
                                className={styles.closeButton}
                            >
                                ✕
                            </button>

                            <img src={image} alt="Preview" className={styles.previewImage} style={{ opacity: result || analyzing ? 0.9 : 1 }} />

                            {!result && !analyzing && <div className={styles.previewOverlay} />}

                            {!result && !analyzing && !limitInfo && (
                                <div className={styles.verificationPanel}>
                                    <h4 className={styles.verificationTitle}>{t('usePhoto')}</h4>
                                    <div className={styles.verificationActions}>
                                        <button
                                            onClick={startAnalysis}
                                            className="btn-primary"
                                            style={{ flex: 2 }}
                                        >
                                            {t('analyze', { mode })}
                                        </button>
                                        <button
                                            onClick={() => { setImage(null); setFile(null); }}
                                            className="btn-secondary"
                                            style={{ flex: 1, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                                        >
                                            {t('change')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {limitInfo && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.65)',
                                    backdropFilter: 'blur(16px)',
                                    zIndex: 20,
                                    padding: '32px',
                                    textAlign: 'center',
                                    animation: 'fadeIn 0.4s ease-out'
                                }}>
                                    <div style={{ fontSize: '3.5rem', marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>💎</div>
                                    <h3 style={{ color: 'white', marginBottom: '12px', fontSize: '1.5rem', fontWeight: 'bold' }}>Límite Diario Alcanzado</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                        Has usado tus {limitInfo.limit} escaneos gratuitos por hoy.
                                        {limitInfo.isEarlyAdopter ? ' Como Early Adopter, puedes adquirir Elite a mitad de precio.' : ''}
                                    </p>
                                    <button
                                        onClick={() => router.push(`/${locale}/subscription`)}
                                        className="btn-primary"
                                        style={{ width: '100%', marginBottom: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
                                    >
                                        Desbloquear Escaneos Ilimitados
                                    </button>
                                    <button
                                        onClick={() => { setLimitInfo(null); setImage(null); setFile(null); }}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '10px', fontSize: '0.9rem', textDecoration: 'underline' }}
                                    >
                                        Volver mañana
                                    </button>
                                </div>
                            )}

                            {analyzing && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.75)',
                                    backdropFilter: 'blur(12px)',
                                    zIndex: 10,
                                    textAlign: 'center',
                                    padding: '24px'
                                }}>
                                    <div className={styles.aiScanner}>
                                        <div className={styles.scannerLine} />
                                    </div>
                                    <h4 style={{ color: 'white', marginTop: '24px', fontSize: '1.2rem', letterSpacing: '0.05em' }}>
                                        {t('analyzing')}
                                    </h4>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '8px' }}>
                                        {pendingScanId ? 'Nuestra IA está procesando tu estilo en la nube...' : 'Preparando análisis...'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Result Dashboard */}
                        {result && (
                            <div className={styles.dashboard}>
                                <div className={styles.dashboardHeader}>
                                    <div>
                                        <div className={styles.archetypeLabel}>
                                            {result.demographics?.archetype || t('detectedStyle')}
                                        </div>
                                        <h3 className={styles.styleTitle}>
                                            {result.style || t('title')}
                                        </h3>
                                    </div>
                                    <div className={styles.scoreContainer}>
                                        <svg width="80" height="80" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="6" />
                                            <circle
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke="var(--color-primary)"
                                                strokeWidth="6"
                                                strokeDasharray="283"
                                                strokeDashoffset={283 - (283 * result.harmonyScore) / 100}
                                                strokeLinecap="round"
                                                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span className={styles.scoreValue}>{result.harmonyScore}</span>
                                        </div>
                                        <span className={styles.scoreLabel}>{t('pts')}</span>
                                    </div>
                                </div>

                                {/* Bento Grid */}
                                <div className={styles.bentoGrid}>
                                    <div className={styles.bentoCard}>
                                        <span className={styles.bentoLabel}>{t('occasionLabel')}</span>
                                        <span className={styles.bentoValue}>📍 {result.occasion || 'Varias'}</span>
                                    </div>
                                    <div className={styles.bentoCard}>
                                        <span className={styles.bentoLabel}>{t('paletteLabel')}</span>
                                        <div className={styles.colorSwatches}>
                                            {result.colors?.slice(0, 4).map((c: string, i: number) => (
                                                <div key={i} className={styles.swatch} style={{ background: c }} />
                                            ))}
                                            {(!result.colors || result.colors.length === 0) && <span>🎨 Mix</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.feedbackBox}>
                                    {result.feedback}
                                </div>

                                {/* Quick Actions */}
                                <div className={styles.actionsContainer}>
                                    <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                                        {saving ? t('saving') : t('saveToHistory')}
                                    </button>

                                    <div className={styles.actionGrid}>
                                        <div className={styles.actionButton} onClick={() => setShowShareModal(true)}>
                                            <span className={styles.actionIcon}>📤</span>
                                            <span className={styles.actionLabel}>{tCommon('share')}</span>
                                        </div>
                                        <div className={styles.actionButton} onClick={handleWardrobeMatch}>
                                            <span className={styles.actionIcon}>👕</span>
                                            <span className={styles.actionLabel}>{t('combine')}</span>
                                        </div>
                                        <div className={styles.actionButton} onClick={() => router.push(`/${locale}/marketplace`)}>
                                            <span className={styles.actionIcon}>🛍️</span>
                                            <span className={styles.actionLabel}>{t('buy')}</span>
                                        </div>
                                        <div className={styles.actionButton}
                                            onClick={result.harmonyScore >= 60 ? handleJoinBattle : undefined}
                                            style={{ opacity: result.harmonyScore < 60 ? 0.5 : 1 }}
                                        >
                                            <span className={styles.actionIcon}>⚔️</span>
                                            <span className={styles.actionLabel}>{t('duel')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Modals placed outside main flow */}
            {result && image && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    imageSrc={image}
                    result={result}
                />
            )}
        </div >
    );
}

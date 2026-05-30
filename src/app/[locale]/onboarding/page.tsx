'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useLocale } from 'next-intl';
import styles from './onboarding.module.css';
import { logger } from '@/lib/logger';

// ── Constants ──────────────────────────────────────────
const STYLES = [
    'Streetwear', 'Minimalist', 'Vintage', 'Boho', 'Chic', 'Sporty',
    'Formal', 'Casual', 'Grunge', 'Y2K', 'Cottagecore', 'Dark Academia'
];

const BRANDS = [
    'Nike', 'Adidas', 'Zara', 'H&M', 'Gucci', 'Supreme', 'Uniqlo', 'Levi\'s',
    'Prada', 'Balenciaga', 'Vans', 'Converse', 'Urban Outfitters', 'ASOS',
    'Shein', 'Mango', 'Pull&Bear', 'Bershka'
];

const COLORS = [
    { name: 'Black', hex: '#0a0a0a' },
    { name: 'White', hex: '#f5f5f5' },
    { name: 'Beige', hex: '#e8d5b7' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Olive', hex: '#6b7c3a' },
    { name: 'Burgundy', hex: '#7c1d2e' },
    { name: 'Forest', hex: '#2d6a4f' },
    { name: 'Camel', hex: '#c19a6b' },
    { name: 'Gray', hex: '#6b7280' },
    { name: 'Denim', hex: '#1a4a7a' },
    { name: 'Cream', hex: '#fef9ef' },
    { name: 'Charcoal', hex: '#374151' }
];

const SIZES = {
    tops: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    bottoms: ['26', '28', '30', '32', '34', '36', '38', '40'],
    shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44']
};

const FOLLOW_SUGGESTIONS = [
    { emoji: '👗', name: 'Sofia Reyes', handle: '@sofiastyle', styles: 'Chic · Minimalist' },
    { emoji: '🧢', name: 'Marco Torres', handle: '@marcofit', styles: 'Streetwear · Y2K' },
    { emoji: '🌿', name: 'Luna Verde', handle: '@lunaboho', styles: 'Boho · Cottagecore' },
    { emoji: '🤍', name: 'Nico Black', handle: '@nicominimal', styles: 'Minimalist · Formal' },
    { emoji: '🔥', name: 'Dani Grunge', handle: '@danixgrunge', styles: 'Grunge · Dark Academia' },
];

const TOTAL_STEPS = 10;

// ── Component ──────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const locale = useLocale();
    const [step, setStep] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [sizePreferences, setSizePreferences] = useState({ top: '', bottom: '', shoe: '' });
    const [budgetRange, setBudgetRange] = useState({ min: 0, max: 500 });
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [profileVisibility, setProfileVisibility] = useState('public');
    const [facialProfile, setFacialProfile] = useState<Record<string, string> | null>(null);
    const [facialImage, setFacialImage] = useState<string | null>(null);
    const [analyzingFace, setAnalyzingFace] = useState(false);
    const [followed, setFollowed] = useState<string[]>([]);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const progress = Math.round((step / TOTAL_STEPS) * 100);

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const canProceed = () => {
        switch (step) {
            case 0: return true;
            case 1: return facialProfile !== null;
            case 2: return selectedStyles.length > 0;
            case 3: return true;
            case 4: return selectedColors.length > 0;
            case 5: return true;
            case 6: return true;
            case 7: return true;
            case 8: return username.trim().length > 0;
            case 9: return true;
            case 10: return true;
            default: return true;
        }
    };

    const handleFaceAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFacialImage(URL.createObjectURL(file));
        setAnalyzingFace(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('mode', 'FACIAL_PROFILE');
            formData.append('locale', locale);

            // Call the secure server-side API endpoint
            const res = await fetch('/api/analyze', { method: 'POST', body: formData });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Analysis failed');
            }
            const result = await res.json();
            setFacialProfile(result);
        } catch (error) {
            logger.error('Error during facial analysis:', error);
        } finally {
            setAnalyzingFace(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setAvatarUrl(data.url || data.imageUrl || avatarPreview);
            }
        } catch (err) {
            logger.error('Avatar upload error:', err);
            setAvatarUrl(avatarPreview); // fallback to object URL
        } finally {
            setUploadingAvatar(false);
        }
    };

    const goToStep = useCallback((nextStep: number) => {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => {
            setStep(nextStep);
            setAnimating(false);
        }, 250);
    }, [animating]);

    const handleNext = async () => {
        if (step < TOTAL_STEPS) {
            goToStep(step + 1);
        } else {
            setLoading(true);
            try {
                const res = await fetch('/api/onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        styles: selectedStyles,
                        brands: selectedBrands,
                        colors: selectedColors,
                        sizePreferences,
                        budgetRange,
                        username,
                        bio,
                        avatarUrl,
                        pronouns,
                        privacySettings: {
                            profileVisibility,
                            wardrobeVisibility: profileVisibility,
                            allowComments: true
                        },
                        facialProfile
                    })
                });
                if (res.ok) {
                    router.push(`/${locale}`);
                } else {
                    alert('Error al guardar tus preferencias. Intenta de nuevo.');
                }
            } catch (error) {
                logger.error('Error saving onboarding:', error);
                alert('Error al guardar tus preferencias. Intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 0) goToStep(step - 1);
    };

    // ── Step Renderers ──────────────────────────────────

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounceIn 0.7s ease' }}>✨</div>
                            <h2 className={styles.stepTitle}>¡Bienvenido a Looksy!</h2>
                            <p className={styles.stepDescription}>
                                Tu red social de moda personalizada con inteligencia artificial.
                                Configuremos tu perfil único en solo 2 minutos.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { icon: '🤳', text: 'Análisis facial IA' },
                                { icon: '👗', text: 'Estilo personalizado' },
                                { icon: '🏆', text: 'Batallas de moda' },
                                { icon: '🌍', text: 'Comunidad global' },
                            ].map(item => (
                                <div key={item.text} style={{
                                    padding: '0.875rem',
                                    borderRadius: '14px',
                                    background: 'rgba(168, 85, 247, 0.08)',
                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{item.icon}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.text}</div>
                                </div>
                            ))}
                        </div>
                    </>
                );

            case 1:
                return (
                    <>
                        <h2 className={styles.stepTitle}>Tu Perfil Facial IA</h2>
                        <p className={styles.stepDescription}>
                            Analizamos tu fisionomía para darte recomendaciones exactas de maquillaje, peinado y estilo.
                        </p>
                        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                            {!facialImage ? (
                                <label className={styles.uploadBox}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📸</div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Sube una foto de tu rostro</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>JPG, PNG, WEBP — máx 5MB</div>
                                    <input type="file" accept="image/*" onChange={handleFaceAnalysis} style={{ display: 'none' }} />
                                </label>
                            ) : (
                                <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto' }}>
                                    <img src={facialImage} alt="Facial" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
                                    {analyzingFace && (
                                        <div style={{
                                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                            borderRadius: '20px', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                        }}>
                                            <div style={{ fontSize: '2rem', animation: 'spin 1.5s linear infinite' }}>⚡</div>
                                            <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>ANALIZANDO...</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {facialProfile && (
                            <div style={{
                                marginTop: '1rem', background: 'rgba(16, 185, 129, 0.08)',
                                padding: '1rem 1.25rem', borderRadius: '16px',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                animation: 'stepSlideIn 0.4s ease'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>
                                    <strong style={{ color: '#10b981', fontSize: '0.9rem' }}>Perfil Detectado</strong>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                                    {Object.entries(facialProfile).slice(0, 4).map(([k, v]) => (
                                        <div key={k} style={{ opacity: 0.9 }}>
                                            <span style={{ color: 'var(--color-text-dim)' }}>{k}: </span>
                                            <strong>{String(v)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );

            case 2:
                return (
                    <>
                        <h2 className={styles.stepTitle}>¿Qué estilos te definen?</h2>
                        <p className={styles.stepDescription}>Selecciona todos los que te gusten — {selectedStyles.length} elegidos</p>
                        <div className={styles.grid}>
                            {STYLES.map(s => (
                                <div
                                    key={s}
                                    className={`${styles.option} ${selectedStyles.includes(s) ? styles.selected : ''}`}
                                    onClick={() => toggleSelection(s, selectedStyles, setSelectedStyles)}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    </>
                );

            case 3:
                return (
                    <>
                        <h2 className={styles.stepTitle}>¿Tus marcas favoritas?</h2>
                        <p className={styles.stepDescription}>Opcional — {selectedBrands.length} seleccionadas</p>
                        <div className={styles.grid}>
                            {BRANDS.map(b => (
                                <div
                                    key={b}
                                    className={`${styles.option} ${selectedBrands.includes(b) ? styles.selected : ''}`}
                                    onClick={() => toggleSelection(b, selectedBrands, setSelectedBrands)}
                                >
                                    {b}
                                </div>
                            ))}
                        </div>
                    </>
                );

            case 4:
                return (
                    <>
                        <h2 className={styles.stepTitle}>¿Qué colores prefieres?</h2>
                        <p className={styles.stepDescription}>Tu paleta — {selectedColors.length} elegidos</p>
                        <div className={styles.colorGrid}>
                            {COLORS.map(color => (
                                <div
                                    key={color.name}
                                    className={`${styles.colorOption} ${selectedColors.includes(color.name) ? styles.selected : ''}`}
                                    style={{ backgroundColor: color.hex }}
                                    onClick={() => toggleSelection(color.name, selectedColors, setSelectedColors)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        {selectedColors.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {selectedColors.map(c => {
                                    const found = COLORS.find(col => col.name === c);
                                    return (
                                        <span key={c} style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            background: found?.hex,
                                            color: ['White', 'Cream', 'Beige'].includes(c) ? '#111' : 'white',
                                            fontWeight: 600
                                        }}>{c}</span>
                                    );
                                })}
                            </div>
                        )}
                    </>
                );

            case 5:
                return (
                    <>
                        <h2 className={styles.stepTitle}>¿Cuáles son tus tallas?</h2>
                        <p className={styles.stepDescription}>Opcional — Para mejores recomendaciones</p>
                        {(['top', 'bottom', 'shoe'] as const).map((type, i) => {
                            const labels = ['Parte Superior', 'Pantalones/Faldas', 'Calzado (EU)'];
                            const options = type === 'top' ? SIZES.tops : type === 'bottom' ? SIZES.bottoms : SIZES.shoes;
                            const cols = type === 'top' ? 6 : 4;
                            return (
                                <div key={type} className={styles.inputGroup}>
                                    <label className={styles.label}>{labels[i]}: <strong>{sizePreferences[type] || '—'}</strong></label>
                                    <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                                        {options.map(size => (
                                            <div
                                                key={size}
                                                className={`${styles.option} ${sizePreferences[type] === size ? styles.selected : ''}`}
                                                onClick={() => setSizePreferences({ ...sizePreferences, [type]: size })}
                                                style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem' }}
                                            >
                                                {size}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                );

            case 6:
                return (
                    <>
                        <h2 className={styles.stepTitle}>¿Cuál es tu presupuesto?</h2>
                        <p className={styles.stepDescription}>Rango de precio para compras (USD)</p>
                        <div className={styles.rangeValue}>${budgetRange.min} – ${budgetRange.max}</div>
                        {[
                            { key: 'min', label: 'Mínimo', max: 1000, step: 50 },
                            { key: 'max', label: 'Máximo', max: 2000, step: 100 },
                        ].map(({ key, label, max, step: s }) => (
                            <div key={key} className={styles.inputGroup}>
                                <label className={styles.label}>{label}: ${budgetRange[key as 'min' | 'max']}</label>
                                <input
                                    type="range" min="0" max={max} step={s}
                                    value={budgetRange[key as 'min' | 'max']}
                                    onChange={(e) => setBudgetRange({ ...budgetRange, [key]: parseInt(e.target.value) })}
                                    className={styles.rangeSlider}
                                />
                            </div>
                        ))}
                    </>
                );

            case 7:
                return (
                    <>
                        <h2 className={styles.stepTitle}>Foto de Perfil</h2>
                        <p className={styles.stepDescription}>Opcional — Sube directamente o añádela después</p>
                        <div style={{ textAlign: 'center' }}>
                            <div className={styles.avatarWrapper} onClick={() => avatarInputRef.current?.click()}>
                                {avatarPreview ? (
                                    <>
                                        <img src={avatarPreview} alt="Avatar" className={styles.avatarPreview} />
                                        <div className={styles.avatarEditOverlay}>📷</div>
                                    </>
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        <span>📷</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>Subir foto</span>
                                    </div>
                                )}
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            {uploadingAvatar && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                                    Subiendo foto...
                                </div>
                            )}
                            {avatarUrl && !uploadingAvatar && (
                                <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem' }}>
                                    ✓ Foto lista
                                </div>
                            )}
                        </div>
                    </>
                );

            case 8:
                return (
                    <>
                        <h2 className={styles.stepTitle}>Crea tu Perfil</h2>
                        <p className={styles.stepDescription}>Cuéntanos quién eres en el mundo de la moda</p>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Nombre de Usuario *</label>
                            <input
                                type="text" value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                                placeholder="@tunombre" className={styles.input} maxLength={30}
                            />
                            {username && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                                    Tu perfil: looksy.app/@{username}
                                </div>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Bio</label>
                            <textarea
                                value={bio} onChange={(e) => setBio(e.target.value)}
                                placeholder="Cuéntale al mundo sobre tu estilo..."
                                className={styles.textarea} maxLength={150}
                            />
                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                                {bio.length}/150
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Pronombres (Opcional)</label>
                            <input
                                type="text" value={pronouns}
                                onChange={(e) => setPronouns(e.target.value)}
                                placeholder="Ej: ella/she, él/he, elle/they"
                                className={styles.input}
                            />
                        </div>
                    </>
                );

            case 9:
                return (
                    <>
                        <h2 className={styles.stepTitle}>Privacidad</h2>
                        <p className={styles.stepDescription}>¿Quién puede ver tu perfil y ropero?</p>
                        {[
                            { value: 'public', icon: '🌍', title: 'Público', desc: 'Cualquiera puede ver tu perfil y contenido' },
                            { value: 'friends', icon: '👫', title: 'Solo seguidores', desc: 'Solo tus seguidores ven tu contenido' },
                            { value: 'private', icon: '🔒', title: 'Privado', desc: 'Solo tú puedes ver tu perfil' },
                        ].map(opt => (
                            <div
                                key={opt.value}
                                className={`${styles.option} ${profileVisibility === opt.value ? styles.selected : ''}`}
                                style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}
                                onClick={() => setProfileVisibility(opt.value)}
                            >
                                <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{opt.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.title}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{opt.desc}</div>
                                </div>
                            </div>
                        ))}
                    </>
                );

            case 10:
                return (
                    <>
                        <div style={{ textAlign: 'center' }}>
                            <span className={styles.successEmoji}>🚀</span>
                            <h2 className={styles.stepTitle} style={{ margin: '0 0 0.5rem' }}>¡Todo listo!</h2>
                            <p className={styles.stepDescription} style={{ marginBottom: '1.5rem' }}>
                                Tu cuenta está configurada. ¡Bienvenido a la comunidad de moda más exclusiva!
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-dim)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Sugerencias para seguir
                            </div>
                            {FOLLOW_SUGGESTIONS.map(user => (
                                <div key={user.handle} className={styles.followSuggestCard}>
                                    <div className={styles.followAvatar}>{user.emoji}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{user.handle} · {user.styles}</div>
                                    </div>
                                    <button
                                        className={`${styles.followBtn} ${followed.includes(user.handle) ? styles.followed : ''}`}
                                        onClick={() => setFollowed(f => f.includes(user.handle) ? f.filter(h => h !== user.handle) : [...f, user.handle])}
                                    >
                                        {followed.includes(user.handle) ? '✓ Siguiendo' : 'Seguir'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.successBadges}>
                            {selectedStyles.slice(0, 3).map((s, i) => (
                                <span key={s} className={styles.successBadge} style={{ '--i': i } as React.CSSProperties}>{s}</span>
                            ))}
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    // ── Render ──────────────────────────────────────────
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {step === 0 && (
                    <>
                        <h1 className={styles.title}>Looksy</h1>
                        <p className={styles.subtitle}>Tu red social de moda con IA</p>
                    </>
                )}

                {/* Progress bar */}
                {step > 0 && (
                    <div className={styles.progressWrapper}>
                        <div className={styles.progressLabel}>
                            <span>Paso {step} de {TOTAL_STEPS}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {/* Step content */}
                <div className={`${styles.stepContainer} ${animating ? styles.stepExit : styles.stepEnter}`}>
                    {renderStep()}
                </div>

                {/* Navigation */}
                <div className={styles.footer}>
                    <div className={styles.navigation}>
                        {step > 0 && (
                            <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={handleBack}>
                                ← Atrás
                            </button>
                        )}
                        <button
                            className={styles.button}
                            onClick={handleNext}
                            disabled={loading || !canProceed()}
                        >
                            {loading ? 'Guardando...' : step === TOTAL_STEPS ? '✨ Finalizar' : 'Siguiente →'}
                        </button>
                    </div>

                    {step > 0 && step < TOTAL_STEPS && (
                        <div className={styles.skipButton} onClick={() => goToStep(TOTAL_STEPS)}>
                            Saltar al final
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes bounceIn {
                    from { transform: scale(0.3); opacity: 0; }
                    80% { transform: scale(1.1); }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

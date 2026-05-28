'use client'

import { useState } from 'react'
import { FaInstagram, FaTiktok, FaLink, FaCheckCircle } from 'react-icons/fa'
import logger from '@/lib/logger'

export default function SocialConnect({ onConnect }: { onConnect: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleConnect = async (platform: string) => {
        setLoading(true)
        const handle = prompt(`Ingresa tu usuario de ${platform}:`)
        if (!handle) {
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/influencer/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, handle })
            })
            if (res.ok) {
                onConnect()
                // Using a more elegant success feedback would be better than alert, 
                // but keeping it simple for now as per functionality.
            } else {
                alert('Error al vincular cuenta. Intenta de nuevo.')
            }
        } catch (e) {
            logger.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-premium" style={{ 
            padding: '24px', 
            borderRadius: '32px', 
            border: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)'
        }}>
            <h3 style={{ 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                marginBottom: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px' 
            }}>
                <FaLink color="#a855f7" /> Vincular Redes
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    onClick={() => handleConnect('Instagram')}
                    disabled={loading}
                    className="btn-luxury"
                    style={{
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '14px',
                        border: 'none',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.95rem'
                    }}
                >
                    <FaInstagram style={{ fontSize: '1.4rem' }} /> Instagram
                </button>
                
                <button
                    onClick={() => handleConnect('TikTok')}
                    disabled={loading}
                    className="btn-luxury"
                    style={{
                        background: '#000000',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '14px',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                    }}
                >
                    <FaTiktok style={{ fontSize: '1.4rem' }} /> TikTok
                </button>
            </div>

            <div style={{ 
                marginTop: '24px', 
                padding: '16px', 
                background: 'rgba(16, 185, 129, 0.05)', 
                borderRadius: '16px', 
                border: '1px solid rgba(16, 185, 129, 0.1)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
            }}>
                <FaCheckCircle color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', lineHeight: 1.4 }}>
                    Vincular tus redes aumenta tu <strong>Score de Influencer</strong> y te permite acceder a campañas pagadas de marcas exclusivas.
                </p>
            </div>
        </div>
    )
}

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './EventPhotoGallery.module.css';
import logger from '@/lib/logger';

type Photo = {
    id: string;
    imageUrl: string;
    caption?: string;
    username: string;
    createdAt: string;
};

export default function EventPhotoGallery({ eventId }: { eventId: string }) {
    const { data: session } = useSession();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [newPhotoCaption, setNewPhotoCaption] = useState('');

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/photos`);
            if (res.ok) {
                const data = await res.json();
                setPhotos(data);
            }
        } catch (error) {
            logger.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [eventId]);

    const handleUploadPhoto = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) {
            alert('Debes iniciar sesión para subir fotos');
            return;
        }

        if (!newPhotoUrl.trim()) {
            alert('Por favor ingresa una URL de imagen');
            return;
        }

        setUploading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: newPhotoUrl.trim(),
                    caption: newPhotoCaption.trim() || undefined
                })
            });

            if (res.ok) {
                setNewPhotoUrl('');
                setNewPhotoCaption('');
                setShowUploadModal(false);
                fetchPhotos(); // Refresh photos
            } else {
                const data = await res.json();
                alert(data.error || 'Error al subir foto');
            }
        } catch (error) {
            logger.error('Error uploading photo:', error);
            alert('Error al subir foto');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <p>Cargando fotos...</p>
            </div>
        );
    }

    return (
        <div className={styles.galleryContainer}>
            {/* Upload Button */}
            {session?.user && (
                <button
                    className={styles.uploadButton}
                    onClick={() => setShowUploadModal(true)}
                >
                    📸 Subir Foto
                </button>
            )}

            {/* Photos Grid */}
            {photos.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📸</span>
                    <h3>No hay fotos aún</h3>
                    <p>Sé el primero en compartir fotos del evento</p>
                    {session?.user && (
                        <button
                            className="btn-primary"
                            onClick={() => setShowUploadModal(true)}
                            style={{ marginTop: '16px' }}
                        >
                            Subir primera foto
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.photoGrid}>
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className={styles.photoCard}
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <img src={photo.imageUrl} alt={photo.caption || 'Event photo'} />
                            <div className={styles.photoOverlay}>
                                <div className={styles.photoInfo}>
                                    <strong>{photo.username}</strong>
                                    {photo.caption && <p>{photo.caption}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className={styles.modal} onClick={() => setShowUploadModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Subir Foto</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowUploadModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleUploadPhoto} className={styles.uploadForm}>
                            <div className={styles.formGroup}>
                                <label>URL de la imagen *</label>
                                <input
                                    type="url"
                                    value={newPhotoUrl}
                                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                    required
                                    disabled={uploading}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Descripción (opcional)</label>
                                <textarea
                                    value={newPhotoCaption}
                                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                                    placeholder="Agrega una descripción..."
                                    rows={3}
                                    disabled={uploading}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={uploading}
                                >
                                    {uploading ? 'Subiendo...' : 'Subir'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {selectedPhoto && (
                <div className={styles.lightbox} onClick={() => setSelectedPhoto(null)}>
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.closeLightbox}
                            onClick={() => setSelectedPhoto(null)}
                        >
                            ✕
                        </button>
                        <img src={selectedPhoto.imageUrl} alt={selectedPhoto.caption || 'Event photo'} />
                        <div className={styles.lightboxInfo}>
                            <strong>{selectedPhoto.username}</strong>
                            {selectedPhoto.caption && <p>{selectedPhoto.caption}</p>}
                            <span className={styles.photoDate}>
                                {new Date(selectedPhoto.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

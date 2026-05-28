'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

export default function NewEventPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        location: '',
        dressCode: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/events'); // Redirect to events list (to be created/verified)
                router.refresh();
            } else {
                alert('Error creating event');
            }
        } catch (error) {
            logger.error('Error creating event:', error);
            alert('Error creating event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--color-accent)' }}>Create New Event</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Event Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                        placeholder="e.g., Summer Gala"
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date & Time</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location</label>
                    <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                        placeholder="e.g., Grand Hotel"
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dress Code</label>
                    <select
                        required
                        value={formData.dressCode}
                        onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    >
                        <option value="">Select Dress Code</option>
                        <option value="Casual">Casual</option>
                        <option value="Smart Casual">Smart Casual</option>
                        <option value="Cocktail">Cocktail</option>
                        <option value="Black Tie">Black Tie</option>
                        <option value="Avant Garde">Avant Garde</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </form>
        </main>
    );
}

export default function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'text' | 'avatar' | 'feed' }) {
    if (type === 'feed') {
        return (
            <div style={{ padding: '16px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div className="skeleton skeleton-avatar" />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                                <div className="skeleton skeleton-text" style={{ width: '60%', height: '12px' }} />
                            </div>
                        </div>
                        <div className="skeleton skeleton-card" />
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                            <div className="skeleton skeleton-text" style={{ width: '60px' }} />
                            <div className="skeleton skeleton-text" style={{ width: '60px' }} />
                            <div className="skeleton skeleton-text" style={{ width: '60px' }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'card') {
        return <div className="skeleton skeleton-card" />;
    }

    if (type === 'text') {
        return <div className="skeleton skeleton-text" />;
    }

    if (type === 'avatar') {
        return <div className="skeleton skeleton-avatar" />;
    }

    return null;
}

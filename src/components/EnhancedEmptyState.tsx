interface EnhancedEmptyStateProps {
    type: 'scans' | 'wardrobe' | 'polls' | 'comments' | 'search';
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EnhancedEmptyState({
    type,
    title,
    message,
    actionLabel,
    onAction
}: EnhancedEmptyStateProps) {
    const getContent = () => {
        switch (type) {
            case 'scans':
                return {
                    icon: '📸',
                    title: title || '¡Empieza a escanear!',
                    message: message || 'Aún no hay scans. Escanea tu primer outfit y compártelo con la comunidad.',
                    actionLabel: actionLabel || 'Escanear Ahora',
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                };
            case 'wardrobe':
                return {
                    icon: '👔',
                    title: title || 'Tu ropero está vacío',
                    message: message || 'Agrega prendas a tu ropero para crear outfits increíbles.',
                    actionLabel: actionLabel || 'Agregar Prenda',
                    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                };
            case 'polls':
                return {
                    icon: '💭',
                    title: title || 'Sin encuestas aún',
                    message: message || 'Crea una encuesta y pide consejo de estilo a la comunidad.',
                    actionLabel: actionLabel || 'Crear Encuesta',
                    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                };
            case 'comments':
                return {
                    icon: '💬',
                    title: title || 'Sin comentarios',
                    message: message || 'Sé el primero en comentar este scan.',
                    actionLabel: actionLabel || 'Comentar',
                    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                };
            case 'search':
                return {
                    icon: '🔍',
                    title: title || 'Sin resultados',
                    message: message || 'No encontramos lo que buscas. Intenta con otros términos.',
                    actionLabel: actionLabel || 'Limpiar Búsqueda',
                    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                };
        }
    };

    const content = getContent();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
            minHeight: '400px'
        }}>
            <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: content.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3.5rem',
                marginBottom: '24px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                animation: 'bounce 2s infinite'
            }}>
                {content.icon}
            </div>

            <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'var(--color-text)'
            }}>
                {content.title}
            </h3>

            <p style={{
                fontSize: '1rem',
                color: 'var(--color-text-dim)',
                marginBottom: '32px',
                maxWidth: '400px',
                lineHeight: '1.6'
            }}>
                {content.message}
            </p>

            {onAction && (
                <button
                    onClick={onAction}
                    className="btn-primary"
                    style={{
                        fontSize: '1rem',
                        padding: '14px 32px'
                    }}
                >
                    {content.actionLabel}
                </button>
            )}
        </div>
    );
}

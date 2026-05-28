'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import styles from './EventChat.module.css';
import logger from '@/lib/logger';

type Message = {
    id: string;
    content: string;
    username: string;
    userId: string;
    userEmail?: string;
    avatarUrl?: string;
    imageUrl?: string;
    createdAt: string;
};

export default function EventChat({ eventId }: { eventId: string }) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            logger.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        
        const channel = supabase
            .channel(`event-chat-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'EventMessage',
                    filter: `eventId=eq.${eventId}`,
                },
                () => {
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) {
            alert('Debes iniciar sesión para enviar mensajes');
            return;
        }

        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch(`/api/events/${eventId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage.trim() })
            });

            if (res.ok) {
                setNewMessage('');
                fetchMessages(); // Refresh messages
            } else {
                const data = await res.json();
                alert(data.error || 'Error al enviar mensaje');
            }
        } catch (error) {
            logger.error('Error sending message:', error);
            alert('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-emerald-500/60 font-medium">Sintonizando el Lobby...</p>
            </div>
        );
    }

    return (
        <div className={`${styles.chatContainer} glass-premium`}>
            {/* Messages List */}
            <div className={styles.messagesList}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                            <span className="text-4xl">💬</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No hay mensajes aún</h3>
                        <p className="text-gray-500 text-sm max-w-[200px]">Sé el primero en iniciar la conversación sobre este evento.</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => {
                            const isMe = session?.user?.id === message.userId || session?.user?.email === message.userEmail;
                            return (
                                <div key={message.id} className={`${styles.message} ${isMe ? styles.myMessage : ''}`}>
                                    <div className={styles.messageAvatar}>
                                        {message.avatarUrl ? (
                                            <img src={message.avatarUrl} alt={message.username} className="rounded-full border border-white/10" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold border border-white/10 text-sm">
                                                {message.username[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.messageContent}>
                                        <div className={styles.messageHeader}>
                                            <strong className="text-gray-200">{message.username}</strong>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {new Date(message.createdAt).toLocaleTimeString(undefined, {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className={`${styles.bubble} ${isMe ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white'}`}>
                                            <p className="text-sm leading-relaxed">{message.content}</p>
                                        </div>
                                        {message.imageUrl && (
                                            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-w-[200px]">
                                                <img
                                                    src={message.imageUrl}
                                                    alt="Attachment"
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            {session?.user && (
                <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/10 flex gap-3 items-center backdrop-blur-md">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mensaje para el Lobby..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-emerald-500 focus:outline-none transition-all"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        disabled={sending || !newMessage.trim()}
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}

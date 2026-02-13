import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
    getOrCreateConversation,
    sendMessage,
    subscribeToMessages,
    subscribeToConversations,
    getOtherUserId,
    markMessagesAsRead,
} from '../services/chat';
import './Chat.css';

const Chat = () => {
    const [searchParams] = useSearchParams();
    const { user, userProfile } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUsers, setOtherUsers] = useState({});
    const [showMobileList, setShowMobileList] = useState(true);

    const messagesEndRef = useRef(null);
    const unsubscribeMessagesRef = useRef(null);

    // Get URL params for starting a new chat
    const targetUserId = searchParams.get('userId');
    const itemId = searchParams.get('itemId');

    useEffect(() => {
        if (!user) return;

        // Subscribe to conversations
        const unsubscribe = subscribeToConversations(user.uid, async (convs) => {
            setConversations(convs);
            setLoading(false);

            // Fetch other users' info
            const userIds = new Set();
            convs.forEach(conv => {
                const otherId = getOtherUserId(conv, user.uid);
                if (otherId) userIds.add(otherId);
            });

            const users = {};
            for (const uid of userIds) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        users[uid] = userDoc.data();
                    }
                } catch (err) {
                    console.error('Error fetching user:', err);
                }
            }
            setOtherUsers(prev => ({ ...prev, ...users }));
        });

        return () => unsubscribe();
    }, [user]);

    // Handle starting a new chat from URL params
    useEffect(() => {
        if (targetUserId && user && targetUserId !== user.uid) {
            startNewConversation(targetUserId, itemId);
        }
    }, [targetUserId, user]);

    // Subscribe to messages when active conversation changes
    useEffect(() => {
        if (!activeConversation) return;

        // Unsubscribe from previous
        if (unsubscribeMessagesRef.current) {
            unsubscribeMessagesRef.current();
        }

        // Subscribe to new conversation's messages
        unsubscribeMessagesRef.current = subscribeToMessages(
            activeConversation.id,
            (msgs) => {
                setMessages(msgs);
                // Mark as read
                markMessagesAsRead(activeConversation.id, user.uid);
            }
        );

        return () => {
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
            }
        };
    }, [activeConversation, user]);

    // Auto-scroll to bottom when new messages arrive
    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [messages]);

    const startNewConversation = async (otherUserId, itemId = null) => {
        try {
            // Get item title if itemId provided
            let itemTitle = null;
            if (itemId) {
                const itemDoc = await getDoc(doc(db, 'items', itemId));
                if (itemDoc.exists()) {
                    itemTitle = itemDoc.data().title;
                }
            }

            const conversationId = await getOrCreateConversation(
                user.uid,
                otherUserId,
                itemId,
                itemTitle
            );

            // Fetch other user's info
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
                setOtherUsers(prev => ({ ...prev, [otherUserId]: userDoc.data() }));
            }

            // Find or create conversation object
            const existingConv = conversations.find(c => c.id === conversationId);
            if (existingConv) {
                setActiveConversation(existingConv);
            } else {
                setActiveConversation({
                    id: conversationId,
                    participants: { [user.uid]: true, [otherUserId]: true },
                    itemId,
                    itemTitle,
                });
            }
            setShowMobileList(false);
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || sending) return;

        setSending(true);
        try {
            await sendMessage(
                activeConversation.id,
                user.uid,
                userProfile?.name || 'User',
                newMessage.trim()
            );
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const selectConversation = (conv) => {
        setActiveConversation(conv);
        setShowMobileList(false);
    };

    const getOtherUserInfo = (conversation) => {
        const otherId = getOtherUserId(conversation, user.uid);
        return otherUsers[otherId] || { name: 'User' };
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (!user) {
        return (
            <div className="chat-page page">
                <div className="empty-state">
                    <span className="empty-icon">💬</span>
                    <h3>Login to chat</h3>
                    <Link to="/login" className="btn btn-primary">Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-page page">
            <div className="chat-container">
                {/* Conversations List */}
                <aside className={`conversations-sidebar ${showMobileList ? 'show-mobile' : ''}`}>
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-conversations">
                            <span>💬</span>
                            <p>No conversations yet</p>
                            <p className="hint">Start a chat from an item page</p>
                        </div>
                    ) : (
                        <div className="conversations-list">
                            {conversations.map((conv) => {
                                const otherUser = getOtherUserInfo(conv);
                                return (
                                    <button
                                        key={conv.id}
                                        className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
                                        onClick={() => selectConversation(conv)}
                                    >
                                        <div className="conv-avatar">
                                            {otherUser.profileImage ? (
                                                <img src={otherUser.profileImage} alt="" />
                                            ) : (
                                                otherUser.name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div className="conv-info">
                                            <h4>{otherUser.name || 'User'}</h4>
                                            {conv.itemTitle && (
                                                <span className="conv-item-ref">Re: {conv.itemTitle}</span>
                                            )}
                                            <p className="last-message">
                                                {conv.lastMessage || 'Start a conversation'}
                                            </p>
                                        </div>
                                        <span className="conv-time">
                                            {formatMessageTime(conv.lastMessageAt)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </aside>

                {/* Chat Area */}
                <main className="chat-area">
                    {activeConversation ? (
                        <>
                            <div className="chat-header">
                                <button
                                    className="back-btn mobile-only"
                                    onClick={() => setShowMobileList(true)}
                                >
                                    ← Back
                                </button>
                                <div className="chat-user">
                                    <div className="chat-avatar">
                                        {getOtherUserInfo(activeConversation).profileImage ? (
                                            <img src={getOtherUserInfo(activeConversation).profileImage} alt="" />
                                        ) : (
                                            getOtherUserInfo(activeConversation).name?.charAt(0) || '?'
                                        )}
                                    </div>
                                    <div>
                                        <h3>{getOtherUserInfo(activeConversation).name || 'User'}</h3>
                                        {activeConversation.itemTitle && (
                                            <p className="chat-item-ref">
                                                Re: {activeConversation.itemTitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="messages-container">
                                {messages.length === 0 ? (
                                    <div className="no-messages">
                                        <p>No messages yet. Say hello! 👋</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                                        >
                                            <p>{msg.content}</p>
                                            <span className="message-time">
                                                {formatMessageTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form className="message-input" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    className="send-btn"
                                    disabled={!newMessage.trim() || sending}
                                >
                                    {sending ? '...' : 'Send'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <span className="no-chat-icon">💬</span>
                            <h3>Select a conversation</h3>
                            <p>Choose a conversation from the list or start a new chat from an item page</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Chat;

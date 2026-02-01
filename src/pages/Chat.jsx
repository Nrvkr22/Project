import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';
import './Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const [searchParams] = useSearchParams();
    const { user, userProfile } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Placeholder - will be implemented in Phase 4
        setLoading(false);
        setConversations([]);
    }, [user]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        // Will be implemented in Phase 4
        setNewMessage('');
    };

    return (
        <div className="chat-page page">
            <div className="chat-container">
                {/* Conversations List */}
                <aside className="conversations-sidebar">
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
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    className={`conversation-item ${activeChat?.id === conv.id ? 'active' : ''}`}
                                    onClick={() => setActiveChat(conv)}
                                >
                                    <div className="conv-avatar">
                                        {conv.otherUser?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="conv-info">
                                        <h4>{conv.otherUser?.name}</h4>
                                        <p className="last-message">{conv.lastMessage}</p>
                                    </div>
                                    <span className="conv-time">{formatDate(conv.lastMessageAt)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Chat Area */}
                <main className="chat-area">
                    {activeChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-user">
                                    <div className="chat-avatar">
                                        {activeChat.otherUser?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3>{activeChat.otherUser?.name}</h3>
                                        {activeChat.item && (
                                            <p className="chat-item-ref">
                                                Re: {activeChat.item.title}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="messages-container">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                                    >
                                        <p>{msg.content}</p>
                                        <span className="message-time">{formatDate(msg.createdAt)}</span>
                                    </div>
                                ))}
                            </div>

                            <form className="message-input" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                />
                                <button type="submit" className="send-btn">
                                    Send
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

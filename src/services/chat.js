import {
    ref,
    push,
    set,
    get,
    onValue,
    query,
    orderByChild,
    serverTimestamp
} from 'firebase/database';
import { realtimeDb } from './firebase';

// Get or create a conversation between two users
export const getOrCreateConversation = async (userId1, userId2, itemId = null, itemTitle = null) => {
    // Create a consistent conversation ID by sorting user IDs
    const sortedIds = [userId1, userId2].sort();
    const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;

    const conversationRef = ref(realtimeDb, `conversations/${conversationId}`);
    const snapshot = await get(conversationRef);

    if (!snapshot.exists()) {
        // Create new conversation
        await set(conversationRef, {
            participants: {
                [userId1]: true,
                [userId2]: true,
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastMessage: '',
            lastMessageAt: Date.now(),
            itemId: itemId || null,
            itemTitle: itemTitle || null,
        });
    } else if (itemId && !snapshot.val().itemId) {
        // Update with item reference if provided
        await set(ref(realtimeDb, `conversations/${conversationId}/itemId`), itemId);
        await set(ref(realtimeDb, `conversations/${conversationId}/itemTitle`), itemTitle);
    }

    return conversationId;
};

// Send a message
export const sendMessage = async (conversationId, senderId, senderName, content) => {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);

    const message = {
        senderId,
        senderName,
        content,
        createdAt: Date.now(),
        read: false,
    };

    await set(newMessageRef, message);

    // Update conversation's last message
    const conversationRef = ref(realtimeDb, `conversations/${conversationId}`);
    await set(ref(realtimeDb, `conversations/${conversationId}/lastMessage`), content);
    await set(ref(realtimeDb, `conversations/${conversationId}/lastMessageAt`), Date.now());
    await set(ref(realtimeDb, `conversations/${conversationId}/updatedAt`), Date.now());

    return { id: newMessageRef.key, ...message };
};

// Subscribe to messages in a conversation (real-time)
export const subscribeToMessages = (conversationId, callback) => {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messages = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                messages.push({
                    id: child.key,
                    ...child.val(),
                });
            });
        }
        // Sort by createdAt
        messages.sort((a, b) => a.createdAt - b.createdAt);
        callback(messages);
    });

    return unsubscribe;
};

// Get user's conversations
export const getUserConversations = async (userId) => {
    const conversationsRef = ref(realtimeDb, 'conversations');
    const snapshot = await get(conversationsRef);

    const conversations = [];
    if (snapshot.exists()) {
        snapshot.forEach((child) => {
            const data = child.val();
            // Check if user is a participant
            if (data.participants && data.participants[userId]) {
                conversations.push({
                    id: child.key,
                    ...data,
                });
            }
        });
    }

    // Sort by lastMessageAt (most recent first)
    conversations.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

    return conversations;
};

// Subscribe to user's conversations (real-time updates)
export const subscribeToConversations = (userId, callback) => {
    const conversationsRef = ref(realtimeDb, 'conversations');

    const unsubscribe = onValue(conversationsRef, (snapshot) => {
        const conversations = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const data = child.val();
                if (data.participants && data.participants[userId]) {
                    conversations.push({
                        id: child.key,
                        ...data,
                    });
                }
            });
        }
        conversations.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
        callback(conversations);
    });

    return unsubscribe;
};

// Get other user's ID from conversation
export const getOtherUserId = (conversation, currentUserId) => {
    if (!conversation.participants) return null;
    const participants = Object.keys(conversation.participants);
    return participants.find(id => id !== currentUserId);
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId, userId) => {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`);
    const snapshot = await get(messagesRef);

    if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach((child) => {
            const message = child.val();
            if (message.senderId !== userId && !message.read) {
                updates[`${child.key}/read`] = true;
            }
        });

        if (Object.keys(updates).length > 0) {
            const messagesRef = ref(realtimeDb, `messages/${conversationId}`);
            // Update each unread message
            for (const [path, value] of Object.entries(updates)) {
                await set(ref(realtimeDb, `messages/${conversationId}/${path}`), value);
            }
        }
    }
};

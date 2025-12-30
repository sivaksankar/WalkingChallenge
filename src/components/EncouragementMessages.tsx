'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface Message {
  id: string;
  senderName: string;
  message: string;
  createdAt: string;
  likes: string[];
}

export function EncouragementMessages({ challengeId }: { challengeId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [challengeId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/encourage?challengeId=${challengeId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages/encourage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          message: newMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const suggestedMessages = [
    "Keep it up! You're doing great! 💪",
    "Let's crush this challenge together! 🔥",
    "Amazing progress everyone! 🎉",
    "Don't give up, we're in this together! 🤝",
    "You got this! One step at a time! 👣"
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">💬 Team Encouragement</h2>
      
      {/* Send message form */}
      <div className="mb-6">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Send an encouraging message to all participants..."
          className="w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
        
        <div className="flex gap-2 mt-2 flex-wrap">
          {suggestedMessages.map((msg, i) => (
            <button
              key={i}
              onClick={() => setNewMessage(msg)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition"
            >
              {msg}
            </button>
          ))}
        </div>

        <Button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {sending ? '⏳ Sending...' : '📤 Send Encouragement'}
        </Button>
      </div>

      {/* Messages list */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No messages yet. Be the first to encourage your team! 🎉
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold text-gray-900">{msg.senderName}</span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-gray-700">{msg.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

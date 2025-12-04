'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { ChatMessage, NearbyCar } from '@/types';

interface ChatPanelProps {
    userLat: number | null;
    userLng: number | null;
    onCarsUpdate: (cars: NearbyCar[], highlightCarId: string | null) => void;
}

export default function ChatPanel({ userLat, userLng, onCarsUpdate }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            from: 'bot',
            text: '👋 Hi! I can help you find nearby cars.\n\nType `/help` to see available commands.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        if (!userLat || !userLng) {
            setMessages(prev => [...prev, {
                from: 'bot',
                text: '📍 Waiting for your location... Please allow location access to use this feature.'
            }]);
            return;
        }

        const userMessage = inputValue.trim();

        // Add user message to chat
        setMessages(prev => [...prev, { from: 'user', text: userMessage }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await api.sendChatMessage({
                message: userMessage,
                userLat,
                userLng
            });

            // Add bot response
            setMessages(prev => [...prev, { from: 'bot', text: response.reply }]);

            // Update cars on map if any returned
            if (response.cars && response.cars.length > 0) {
                onCarsUpdate(response.cars, response.highlight_car_id);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                from: 'bot',
                text: '❌ Sorry, something went wrong. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCommandClick = (command: string) => {
        setInputValue(command);
    };

    return (
        <div className="flex flex-col h-full border-t border-border bg-background/50">
            {/* Header */}
            <div className="p-3 border-b border-border bg-background/80 backdrop-blur">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Atlas Assistant</h3>
                        <p className="text-xs text-muted-foreground">AI Car Finder</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.from === 'user'
                                    ? 'bg-primary text-primary-foreground ml-8'
                                    : 'bg-muted/50 text-foreground mr-8'
                                }`}
                        >
                            <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm mr-8">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Commands */}
            <div className="px-3 pb-2 flex gap-2 flex-wrap">
                <button
                    onClick={() => handleCommandClick('/help')}
                    className="text-xs px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    /help
                </button>
                <button
                    onClick={() => handleCommandClick('/nearme')}
                    className="text-xs px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    /nearme
                </button>
                <button
                    onClick={() => handleCommandClick('/nearme 5')}
                    className="text-xs px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    /nearme 5
                </button>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background/80 backdrop-blur">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a command... (e.g., /nearme)"
                        className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

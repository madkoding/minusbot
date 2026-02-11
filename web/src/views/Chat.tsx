import React, { useState, useEffect, useRef } from "react";
import { Button, Icon } from "../components/UI.tsx";
import { api, getWSUrl } from "../api.ts";

export default function ChatView() {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [chats, setChats] = useState<any[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const loadChats = async () => {
        try {
            const res = await api.get('/user/chat');
            setChats(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error("Failed to load chats", e);
        }
    };

    useEffect(() => {
        loadChats();
        const socket = new WebSocket(getWSUrl());
        socket.onopen = () => {
            const token = localStorage.getItem('token');
            socket.send(JSON.stringify({ type: 'auth', token }));
        };
        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'chat_ready') {
                setMessages(msg.messages || []);
                setCurrentChatId(msg.chatId);
                loadChats();
            } else if (msg.type === 'bot_response') {
                // Legacy support (optional, can be removed if backend fully switched)
                setMessages(prev => [...prev, { role: 'assistant', content: msg.content }]);
            } else if (msg.type === 'message') {
                setMessages(prev => [...prev, msg.message]);
            }
        };
        setWs(socket);
        return () => socket.close();
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const selectChat = (id: string | null) => {
        setCurrentChatId(id);
        ws?.send(JSON.stringify({ type: 'init_chat', chatId: id }));
    };

    const send = () => {
        if (!inputText.trim()) return;
        ws?.send(JSON.stringify({ type: 'message', content: inputText }));
        // setMessages(prev => [...prev, { role: 'user', content: inputText }]); // Removed optimistic update
        setInputText('');
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] max-w-7xl mx-auto gap-8">
            <div className="w-72 flex flex-col space-y-4 h-full">
                <Button onClick={() => selectChat(null)} variant="secondary" className="w-full rounded-2xl flex-shrink-0">
                    <Icon name="plus" size={16} /> <span className="ml-2 font-bold tracking-tight">New Thread</span>
                </Button>
                <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {chats.map(c => (
                        <button
                            key={c.id}
                            onClick={() => selectChat(c.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${currentChatId === c.id
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-100 shadow-xl'
                                : 'bg-transparent border-transparent text-zinc-600 hover:bg-zinc-900/40 hover:text-zinc-400'
                                }`}
                        >
                            <div className="text-xs font-bold truncate">Thread: {c.id}</div>
                            <div className="text-[10px] font-medium opacity-60 mt-0.5">
                                {new Date(c.last_activity).toLocaleDateString()}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col border border-zinc-800/50 rounded-3xl bg-zinc-900/20 overflow-hidden shadow-2xl h-full">
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth custom-scrollbar">
                    {messages.filter(m => m.role !== 'system' && m.role !== 'tool').map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-zinc-100 text-zinc-950 font-medium shadow-lg'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                                }`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50">
                            <Icon name="chat" size={48} />
                            <p className="mt-4 font-bold uppercase tracking-widest text-xs">Waiting for Signal</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-zinc-950/50 border-t border-zinc-800/40 backdrop-blur-md flex-shrink-0">
                    <div className="relative flex items-center">
                        <input
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-6 pr-14 py-4 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-600"
                            placeholder="Establish intent..."
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                        />
                        <button
                            onClick={send}
                            className="absolute right-3 p-2 bg-zinc-100 text-zinc-950 rounded-xl hover:bg-zinc-300 transition-all active:scale-95 shadow-lg"
                        >
                            <Icon name="send" size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

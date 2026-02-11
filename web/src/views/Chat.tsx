import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Icon } from "../components/UI.tsx";
import { api, getWSUrl } from "../api.ts";

export default function ChatView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = new WebSocket(getWSUrl());

        socket.onopen = () => {
            const token = localStorage.getItem('token');
            socket.send(JSON.stringify({ type: 'auth', token }));

            // If we have an ID, join it immediately after auth
            if (id) {
                socket.send(JSON.stringify({ type: 'init_chat', chatId: id }));
            } else {
                // For /chat without ID, we can either stay empty or auto-create
                // Let's stay empty until user interacts
            }
        };

        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'chat_ready') {
                setMessages(msg.messages || []);
                if (!id && msg.chatId) {
                    navigate(`/chat/${msg.chatId}`, { replace: true });
                }
            } else if (msg.type === 'message') {
                setMessages(prev => [...prev, msg.message]);
            }
        };

        setWs(socket);
        return () => socket.close();
    }, [id]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const send = () => {
        if (!inputText.trim()) return;
        ws?.send(JSON.stringify({ type: 'message', content: inputText }));
        setInputText('');
    };

    return (
        <div className="flex h-full max-w-5xl mx-auto flex-col border border-zinc-800/50 rounded-[2.5rem] bg-zinc-900/10 overflow-hidden shadow-2xl animate-fade-in">
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar">
                {messages.filter(m => m.role !== 'system' && m.role !== 'tool').map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                        <div className={`max-w-[80%] rounded-3xl px-6 py-4 text-sm leading-[1.6] ${m.role === 'user'
                            ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-[0_10px_30px_rgba(255,255,255,0.05)]'
                            : 'bg-zinc-900/80 border border-zinc-800/50 text-zinc-300 shadow-inner'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />

                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-40 py-20">
                        <div className="w-20 h-20 rounded-[2rem] bg-zinc-900/50 flex items-center justify-center mb-6">
                            <Icon name="chat_alt" size={40} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2">Initialize Link</h3>
                        <p className="max-w-[200px] text-[10px] font-bold uppercase tracking-widest leading-relaxed text-center">Neural connection established. Waiting for your input.</p>
                    </div>
                )}
            </div>

            <div className="p-8 bg-[#0a0a0a]/80 border-t border-zinc-900/50 backdrop-blur-xl flex-shrink-0">
                <div className="relative flex items-center group">
                    <input
                        className="w-full bg-black border border-zinc-800/40 rounded-2xl pl-8 pr-16 py-5 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 shadow-inner group-hover:border-zinc-700/50"
                        placeholder="Speak with Minus..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                    />
                    <button
                        onClick={send}
                        className="absolute right-3 p-3 bg-zinc-100 text-zinc-950 rounded-xl hover:bg-white transition-all active:scale-95 shadow-xl"
                    >
                        <Icon name="send" size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import remarkBreaks from 'remark-breaks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Icon } from "../components/icons";
import { ChatFilesModal } from "../components/modals/ChatFilesModal";
import { Skeleton } from "../components/ui";
import { CommandAutocomplete } from "../components/CommandAutocomplete";
import { useChat } from "../hooks/useChat";
import { useCommands } from "../hooks/useCommands";
import { useAuthStore } from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";

// Component for rendering Tool Calls/Outputs
const ToolBubble = ({ message }: { message: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    const isCall = message.tool_calls && message.tool_calls.length > 0;

    // Parsing content
    let toolName = "Unknown Tool";
    let content = "";

    if (isCall) {
        toolName = message.tool_calls[0].function.name;
        content = JSON.stringify(JSON.parse(message.tool_calls[0].function.arguments), null, 2);
        // Handle multiple calls? For now just take the first one or map them
        if (message.tool_calls.length > 1) {
            toolName += ` + ${message.tool_calls.length - 1} more`;
            content = message.tool_calls.map((c: any) =>
                `// ${c.function.name}\n${JSON.stringify(JSON.parse(c.function.arguments), null, 2)}`
            ).join('\n\n');
        }
    } else {
        // Tool Output
        toolName = "Tool Output"; // We don't easily know the tool name from the output message role='tool' without context, unless we map IDs. 
        // But usually it's just raw result.
        // We can try to guess or just say "System Output"
        try {
            const parsed = JSON.parse(message.content);
            content = JSON.stringify(parsed, null, 2);
        } catch {
            content = message.content;
        }
    }

    return (
        <div className="flex w-full justify-start mb-4 animate-fade-up">
            <div className="max-w-[90%] md:max-w-[80%]">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        cursor-pointer transition-all duration-200 overflow-hidden
                        border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700/50
                        ${isOpen ? 'rounded-2xl' : 'rounded-full px-4 py-2 flex items-center gap-3'}
                    `}
                >
                    {/* Header / Summary View */}
                    <div className={`flex items-center gap-3 text-xs font-mono text-zinc-400 ${isOpen ? 'p-3 border-b border-zinc-800/50 bg-zinc-900/50' : ''}`}>
                        <div className={`p-1.5 rounded-full ${isCall ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            <Icon name={isCall ? "terminal" : "chip"} size={12} />
                        </div>
                        <span className="font-semibold opacity-75">
                            {isCall ? `Used ${toolName}` : `Output from tool`}
                        </span>

                        {!isOpen && (
                            <div className="ml-auto opacity-50">
                                <Icon name="chevron_down" size={12} />
                            </div>
                        )}

                        {isOpen && (
                            <div className="ml-auto opacity-50 rotate-180">
                                <Icon name="chevron_down" size={12} />
                            </div>
                        )}
                    </div>

                    {/* Detailed View */}
                    {isOpen && (
                        <div className="p-3 bg-black/20">
                            <div className="relative group/code">
                                <pre className="text-[10px] sm:text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
                                    {content}
                                </pre>
                                <div className="absolute top-0 right-0 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(content);
                                        }}
                                        className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:text-white"
                                    >
                                        <Icon name="copy" size={10} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function ChatView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { setIsMobileMenuOpen } = useUIStore();
    const { messages, sendMessage, isConnected, error } = useChat(id);
    const { commands } = useCommands();
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);
    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

    const intros = useMemo(() => [
        "How can I help you today?",
        "What's on your mind?",
        "Ready for a new chat. What's up?",
        "I'm here to help. Just ask!",
        "Need a hand with something?",
        "Waiting for your message..."
    ], []);

    const introText = useMemo(() => intros[Math.floor(Math.random() * intros.length)], [intros]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }, []);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (messages.length > 0 || isConnected) {
            setIsLoading(false);
        }
    }, [messages, isConnected]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setShowAutocomplete(inputText.startsWith('/'));
    }, [inputText]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (!id) {
            const newChatId = `chat_${Math.random().toString(36).substring(7)}`;
            sendMessage(inputText, newChatId);
            navigate(`/chat/${newChatId}`, { replace: true });
        } else {
            sendMessage(inputText);
        }

        setInputText('');
        setShowAutocomplete(false);
    };

    const handleAutocompleteSelect = (completion: string) => {
        setInputText(completion);
        setShowAutocomplete(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowAutocomplete(false);
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy code', err);
        }
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isLanding = !id;
    const isChatEmpty = useMemo(() => messages.filter(m => m.role !== 'system').length === 0, [messages]);

    const handleNewChat = () => {
        navigate(`/chat`, { replace: false });
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#050505]">
            {/* Chat Header */}
            <header className="flex-shrink-0 h-16 border-b border-zinc-900 bg-[#070707]/50 backdrop-blur-xl px-4 flex items-center justify-between z-10">
                {/* Left: Sidebar Toggle (Mobile) */}
                <div className="flex items-center lg:w-32">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                    >
                        <Icon name="menu" size={24} />
                    </button>

                    <div className="hidden lg:flex items-center gap-3">
                        <img src="/logo.png" className="w-5 h-5 opacity-50" alt="" />
                    </div>
                </div>

                {/* Center: Title */}
                <div className="flex-1 flex justify-center min-w-0">
                    <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-widest truncate px-2">
                        {id || 'New Chat'}
                    </h2>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 lg:w-32">
                    <button
                        onClick={handleNewChat}
                        className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-all"
                        title="New Chat"
                    >
                        <Icon name="plus" size={18} />
                    </button>
                    <div className="hidden md:block h-4 w-px bg-zinc-800 mx-2" />
                </div>
            </header>

            {/* Connection Status Bar */}
            {!isConnected && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-yellow-500 text-center">
                    Connecting to server...
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 text-center">
                    {error}
                </div>
            )}

            {/* Messages Container - Takes remaining space */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 scroll-smooth custom-scrollbar"
            >
                <div className="max-w-4xl mx-auto h-full flex flex-col">
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    <Skeleton className={`h-20 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'} rounded-3xl`} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {isLanding ? (
                                <div className="flex-1 flex flex-col items-center justify-center animate-fade-up">
                                    <div className="text-center space-y-8 w-full max-w-xl px-4">
                                        <div className="flex justify-center mb-8">
                                            <img src="/logo.png" className="w-18 h-18 md:w-24 md:h-24" alt="Minusbot" />
                                        </div>

                                        <div className="space-y-3">
                                            <h1 className="text-3xl md:text-5xl font-black text-zinc-100 tracking-tighter">
                                                {greeting}, <span className="bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">{user?.username}</span>
                                            </h1>
                                            <p className="text-sm md:text-base text-zinc-500 font-medium">
                                                {introText}
                                            </p>
                                        </div>

                                        <div className="pt-6 w-full px-4">
                                            <div className="relative flex items-center group max-w-sm mx-auto">
                                                <input
                                                    className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-2xl pl-5 pr-14 py-4 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 shadow-2xl"
                                                    placeholder="Type a message..."
                                                    value={inputText}
                                                    onChange={e => setInputText(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    disabled={!isConnected}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleSend}
                                                    disabled={!isConnected || !inputText.trim()}
                                                    className="absolute right-2.5 p-2 bg-zinc-100 text-zinc-950 rounded-xl hover:bg-white transition-all active:scale-95 shadow-xl disabled:opacity-50"
                                                >
                                                    <Icon name="send" size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-12 grid grid-cols-2 gap-3 max-w-sm mx-auto opacity-40">
                                            {['/help', '/stats'].map(cmd => (
                                                <button
                                                    key={cmd}
                                                    onClick={() => setInputText(cmd)}
                                                    className="px-4 py-2 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-zinc-200 transition-all"
                                                >
                                                    {cmd}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 md:space-y-6">
                                    {messages.filter(m => m.role !== 'system').map((m, i) => {
                                        const isUser = m.role === 'user';
                                        const isTool = m.role === 'tool' || (m.tool_calls && m.tool_calls.length > 0);

                                        if (isTool) {
                                            return <ToolBubble key={i} message={m} />;
                                        }

                                        return (
                                            <div
                                                key={i}
                                                className={`flex w-full group ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-up`}
                                                onMouseEnter={() => setHoveredMessageIndex(i)}
                                                onMouseLeave={() => setHoveredMessageIndex(null)}
                                            >
                                                <div className={`relative max-w-[95%] md:max-w-[90%] lg:max-w-[80%] rounded-2xl md:rounded-3xl p-4 md:p-5 text-sm leading-[1.6] group ${isUser
                                                    ? 'bg-zinc-100 text-zinc-950 font-medium shadow-[0_10px_30px_rgba(255,255,255,0.05)]'
                                                    : 'bg-zinc-900/80 border border-zinc-800/50 text-zinc-300 shadow-inner'
                                                    }`}>

                                                    {/* Copy Button */}
                                                    <button
                                                        onClick={() => copyToClipboard(m.content)}
                                                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isUser
                                                            ? 'hover:bg-zinc-200/50 text-zinc-500'
                                                            : 'hover:bg-zinc-800 text-zinc-500'
                                                            }`}
                                                        title="Copy message"
                                                    >
                                                        <Icon name="copy" size={14} />
                                                    </button>

                                                    {/* Content */}
                                                    <div className={`prose ${isUser ? 'prose-zinc font-medium' : 'prose-invert'} max-w-none prose-sm prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent`}>
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                                            components={{
                                                                // Use div instead of p to avoid hydration errors when nesting blocks
                                                                p: ({ children }) => <div className="mb-3 last:mb-0 break-words">{children}</div>,
                                                                ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                                                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
                                                                li: ({ children }) => <li className="pl-1 mb-1">{children}</li>,
                                                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>,
                                                                code({ node, inline, className, children, ...props }: any) {
                                                                    return !inline ? (
                                                                        <div className="relative group/code my-2">
                                                                            <button
                                                                                onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                                                                                className="absolute right-2 top-2 p-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 opacity-0 group-hover/code:opacity-100 transition-opacity hover:bg-zinc-700 hover:text-zinc-200"
                                                                                title="Copy code"
                                                                            >
                                                                                <Icon name="copy" size={12} />
                                                                            </button>
                                                                            <code className={`${className} block bg-zinc-950/50 p-3 rounded-lg overflow-x-auto`} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        </div>
                                                                    ) : (
                                                                        <code className={`${className} bg-zinc-500/10 rounded px-1 py-0.5`} {...props}>
                                                                            {children}
                                                                        </code>
                                                                    )
                                                                }
                                                            }}
                                                        >
                                                            {m.content}
                                                        </ReactMarkdown>
                                                    </div>

                                                    {/* Timestamp */}
                                                    <div className={`text-[10px] mt-2 font-medium opacity-40 select-none ${isUser ? 'text-right' : 'text-left'}`}>
                                                        {formatTime(m.timestamp || m.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {isChatEmpty && !isLanding && (
                                        <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-30">
                                            <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
                                                <Icon name="message" size={24} className="text-zinc-500" />
                                            </div>
                                            <p className="text-zinc-500 text-sm font-medium italic">No messages yet. Send one to start the conversation.</p>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Input Area - Fixed at bottom - Only visible if not landing */}
            {!isLanding && (
                <div className="flex-shrink-0 p-3 md:p-4 lg:p-6 z-20">
                    <div className="max-w-4xl mx-auto relative">
                        {/* Command Autocomplete */}
                        {showAutocomplete && (
                            <CommandAutocomplete
                                input={inputText}
                                commands={commands}
                                onSelect={handleAutocompleteSelect}
                            />
                        )}

                        <div className="relative flex items-center group">
                            <button
                                onClick={() => setIsFilesModalOpen(true)}
                                className="absolute left-2 p-1.5 md:p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all z-10"
                                title="Manage Files"
                                disabled={!isConnected}
                            >
                                <Icon name="paperclip" size={16} />
                            </button>
                            <input
                                ref={inputRef}
                                className="w-full bg-black border border-zinc-800/40 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-12 md:pr-14 py-3 md:py-4 text-xs md:text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 shadow-inner group-hover:border-zinc-700/50 disabled:opacity-50"
                                placeholder="Speak with Minus..."
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={!isConnected}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!isConnected || !inputText.trim()}
                                className="absolute right-2 p-2.5 md:p-3 bg-zinc-100 text-zinc-950 rounded-lg md:rounded-xl hover:bg-white transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="send" size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {id && <ChatFilesModal isOpen={isFilesModalOpen} onClose={() => setIsFilesModalOpen(false)} chatId={id} />}
        </div>
    );
}

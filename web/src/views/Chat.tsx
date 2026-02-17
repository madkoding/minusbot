import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import remarkBreaks from 'remark-breaks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Icon } from "../components/icons";
import { Skeleton } from "../components/ui";
import { CommandAutocomplete } from "../components/CommandAutocomplete";
import { useChat } from "../hooks/useChat";
import { useCommands } from "../hooks/useCommands";

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
    const [chatId, setChatId] = useState<string | undefined>(id);
    const { messages, sendMessage, isConnected, error } = useChat(chatId);
    const { commands } = useCommands();
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // If no ID is provided, create a new chat
    useEffect(() => {
        if (!id && !chatId) {
            const newChatId = `chat_${Math.random().toString(36).substring(7)}`;
            setChatId(newChatId);
            navigate(`/chat/${newChatId}`, { replace: true });
        } else if (id && id !== chatId) {
            setChatId(id);
        }
    }, [id, chatId, navigate]);

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
        sendMessage(inputText);
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
        } else if (e.key === 'Enter' && !e.shiftKey && !showAutocomplete) {
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

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            {/* Connection Status Bar */}
            {!isConnected && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-xs text-yellow-500 text-center">
                    Reconnecting to server...
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-500 text-center">
                    {error}
                </div>
            )}

            {/* Messages Container - Takes remaining space */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 scroll-smooth custom-scrollbar"
            >
                <div className="max-w-4xl mx-auto">
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
                                        <div className={`relative max-w-[90%] md:max-w-[80%] rounded-3xl p-5 text-sm leading-[1.6] group ${isUser
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
                                            <div className={`prose ${isUser ? 'prose-zinc' : 'prose-invert'} max-w-none prose-sm prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                                    components={{
                                                        // Custom components to ensure proper rendering
                                                        p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                                        li: ({ children }) => <li className="pl-1">{children}</li>,
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
                            <div ref={chatEndRef} />

                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-40 py-20">
                                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-900/50 flex items-center justify-center mb-6">
                                        <Icon name="chat_alt" size={40} />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2">Ready</h3>
                                    <p className="max-w-[200px] text-[10px] font-bold uppercase tracking-widest leading-relaxed text-center">Start a conversation with Minus</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 md:p-6 bg-[#0a0a0a]/80 border-t border-zinc-900/50 backdrop-blur-xl relative">
                <div className="max-w-4xl mx-auto">
                    {/* Command Autocomplete */}
                    {showAutocomplete && (
                        <CommandAutocomplete
                            input={inputText}
                            commands={commands}
                            onSelect={handleAutocompleteSelect}
                        />
                    )}

                    <div className="relative flex items-center group">
                        <input
                            ref={inputRef}
                            className="w-full bg-black border border-zinc-800/40 rounded-2xl pl-6 pr-14 py-4 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 shadow-inner group-hover:border-zinc-700/50 disabled:opacity-50"
                            placeholder="Speak with Minus..."
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!isConnected}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!isConnected || !inputText.trim()}
                            className="absolute right-2 p-3 bg-zinc-100 text-zinc-950 rounded-xl hover:bg-white transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Icon name="send" size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

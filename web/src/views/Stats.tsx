import React, { useEffect } from "react";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { Skeleton } from "../components/ui";
import { useStatsAsAdmin } from "../hooks/useStats";

export default function StatsView() {
    const { stats, fetchStats, isLoading } = useStatsAsAdmin();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const items = [
        { label: "Chats Processed", value: stats?.chats_created, icon: "chat", color: "text-blue-500" },
        { label: "Messages Sent", value: stats?.messages_sent, icon: "send", color: "text-emerald-500" },
        { label: "Total Input", value: stats?.tokens_input, icon: "dashboard", color: "text-amber-500" },
        { label: "Total Output", value: stats?.tokens_output, icon: "vault", color: "text-purple-500" },
    ];

    return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">Live Activity</h2>
                    <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium max-w-lg">View real-time system usage and performance metrics.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map((item, i) => (
                    <Card key={i} className="p-4 md:p-6 bg-zinc-900/40 border-zinc-800/50">
                        <div className={`p-2 rounded-lg bg-zinc-950 w-fit mb-4 ${item.color}`}>
                            <Icon name={item.icon} size={18} />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">{item.label}</div>
                        <div className="relative">
                            {!stats && isLoading ? (
                                <Skeleton className="h-9 w-24" />
                            ) : (
                                <div className={`text-2xl md:text-3xl font-black text-zinc-100 tracking-tighter tabular-nums transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
                                    {item.value?.toLocaleString() ?? "0"}
                                </div>
                            )}
                            {isLoading && stats && (
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-6 md:p-8 border-zinc-800/30 bg-zinc-950/20 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-950">
                        <Icon name="dashboard" size={20} className="md:w-6 md:h-a6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-100 text-sm md:text-base">System Load</h3>
                        <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">Token usage breakdown.</p>
                    </div>
                </div>
                <div className="relative">
                    {!stats && isLoading ? (
                        <div className="space-y-4 pt-2">
                            <Skeleton className="h-4 w-full rounded-full" />
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={`h-3 md:h-4 bg-zinc-900 rounded-full overflow-hidden flex transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
                                <div className="bg-amber-500/80 h-full transition-all duration-1000" style={{ width: `${((stats?.tokens_input || 0) / ((stats?.tokens_input || 0) + (stats?.tokens_output || 0) || 1)) * 100}%` }}></div>
                                <div className="bg-purple-500/80 h-full transition-all duration-1000" style={{ width: `${((stats?.tokens_output || 0) / ((stats?.tokens_input || 0) + (stats?.tokens_output || 0) || 1)) * 100}%` }}></div>
                            </div>
                            <div className={`flex flex-col md:flex-row justify-between gap-2 mt-4 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Input Tokens</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <span className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Output Tokens</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}

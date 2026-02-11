import React, { useEffect } from "react";
import { Card } from "../components/cards";
import { Icon } from "../components/icons";
import { useStats } from "../hooks/useStats";

export default function DashboardView() {
    const { userStats, fetchUserStats, isLoading } = useStats();

    useEffect(() => {
        fetchUserStats();
        const pollInterval = setInterval(fetchUserStats, 5000);
        return () => clearInterval(pollInterval);
    }, [fetchUserStats]);

    if (isLoading && !userStats) return <div className="animate-pulse text-zinc-500 font-bold uppercase tracking-widest">Synchronizing...</div>;
    if (!userStats) return <div className="text-zinc-500 font-bold uppercase tracking-widest">No telemetry available.</div>;

    return (
        <div className="space-y-12 max-w-6xl mx-auto">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Performance Telemetry</h2>
                    <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Real-time heuristics and resource utilization of your neural network.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card title="Activity" description="Conversations">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{userStats.chats_created?.toLocaleString() ?? 0}</div>
                        <Icon name="chat_alt" className="text-zinc-700" size={20} />
                    </div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Total Threads</div>
                </Card>
                <Card title="Exchange" description="Messages">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{userStats.messages_sent?.toLocaleString() ?? 0}</div>
                        <Icon name="send" className="text-emerald-700/50" size={20} />
                    </div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Interactions</div>
                </Card>
                <Card title="Input" description="Tokens Received">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{userStats.tokens_input?.toLocaleString() ?? 0}</div>
                        <Icon name="terminal" className="text-amber-700/50" size={20} />
                    </div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Processed</div>
                </Card>
                <Card title="Output" description="Tokens Generated">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{userStats.tokens_output?.toLocaleString() ?? 0}</div>
                        <Icon name="vault" className="text-purple-700/50" size={20} />
                    </div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Generated</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Efficiency" description="Token Ratio">
                    <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex mt-2">
                        <div className="bg-amber-500/80 h-full transition-all duration-1000" style={{ width: `${((userStats.tokens_input || 0) / ((userStats.tokens_input || 0) + (userStats.tokens_output || 0) || 1)) * 100}%` }}></div>
                        <div className="bg-purple-500/80 h-full transition-all duration-1000" style={{ width: `${((userStats.tokens_output || 0) / ((userStats.tokens_input || 0) + (userStats.tokens_output || 0) || 1)) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Input</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Output</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

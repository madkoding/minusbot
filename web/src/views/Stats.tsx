import React, { useState, useEffect } from "react";
import { Card, Icon } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function StatsView({ apiPath = '/admin/stats' }: { apiPath?: string }) {
    const [stats, setStats] = useState<any>(null);

    const load = async () => {
        try {
            const res = await api.get(apiPath);
            setStats(res.data);
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    };

    useEffect(() => { load(); }, [apiPath]);

    if (!stats) return <div className="text-zinc-500 font-bold uppercase tracking-widest text-center py-20">Analyzing Telemetry...</div>;

    const items = [
        { label: "Chats Initiated", value: stats.chats_created, icon: "chat", color: "text-blue-500" },
        { label: "Messages Exchanged", value: stats.messages_sent, icon: "send", color: "text-emerald-500" },
        { label: "Neural Input Tokens", value: stats.tokens_input, icon: "dashboard", color: "text-amber-500" },
        { label: "Neural Output Tokens", value: stats.tokens_output, icon: "vault", color: "text-purple-500" },
    ];

    return (
        <div className="space-y-10 max-w-6xl mx-auto h-full">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Performance Metrics</h2>
                    <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Real-time system utilization and token economics.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item, i) => (
                    <Card key={i} className="p-6 bg-zinc-900/40 border-zinc-800/50">
                        <div className={`p-2 rounded-lg bg-zinc-950 w-fit mb-4 ${item.color}`}>
                            <Icon name={item.icon} size={18} />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">{item.label}</div>
                        <div className="text-3xl font-black text-zinc-100 tracking-tighter tabular-nums">
                            {item.value?.toLocaleString() ?? "0"}
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-8 border-zinc-800/30 bg-zinc-950/20 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-950">
                        <Icon name="dashboard" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-100">Computational Efficiency</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Estimated neural processing load distributed.</p>
                    </div>
                </div>
                <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex">
                    <div className="bg-amber-500/80 h-full transition-all duration-1000" style={{ width: `${((stats.tokens_input || 0) / ((stats.tokens_input || 0) + (stats.tokens_output || 0) || 1)) * 100}%` }}></div>
                    <div className="bg-purple-500/80 h-full transition-all duration-1000" style={{ width: `${((stats.tokens_output || 0) / ((stats.tokens_input || 0) + (stats.tokens_output || 0) || 1)) * 100}%` }}></div>
                </div>
                <div className="flex justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Input Tokens</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Output Tokens</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

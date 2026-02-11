import React, { useState, useEffect } from "react";
import { Card } from "../components/UI.tsx";
import { api } from "../api.ts";

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

export default function DashboardView() {
    const [stats, setStats] = useState<any>(null);
    const [localUptime, setLocalUptime] = useState(0);

    const load = async () => {
        try {
            const res = await api.get('/user/stats'); // New endpoint
            const data = res.data;
            setStats(data);
            // setLocalUptime(data.uptime); // User doesn't need uptime
        } catch (e) {
            console.error("Telemetry failure", e);
        }
    };

    useEffect(() => {
        load();
        const pollInterval = setInterval(load, 5000);
        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        const tickInterval = setInterval(() => {
            setLocalUptime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(tickInterval);
    }, []);

    if (!stats) return <div className="animate-pulse text-zinc-500 font-bold uppercase tracking-widest">Synchronizing...</div>;

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
                    <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{stats.chats_created?.toLocaleString() ?? 0}</div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Total Threads</div>
                </Card>
                <Card title="Exchange" description="Messages">
                    <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{stats.messages_sent?.toLocaleString() ?? 0}</div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Interactions</div>
                </Card>
                <Card title="Input" description="Tokens Received">
                    <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{stats.tokens_input?.toLocaleString() ?? 0}</div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Processed</div>
                </Card>
                <Card title="Output" description="Tokens Generated">
                    <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{stats.tokens_output?.toLocaleString() ?? 0}</div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Generated</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Efficiency" description="Token Ratio">
                    <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex mt-2">
                        <div className="bg-amber-500/80 h-full transition-all duration-1000" style={{ width: `${((stats.tokens_input || 0) / ((stats.tokens_input || 0) + (stats.tokens_output || 0) || 1)) * 100}%` }}></div>
                        <div className="bg-purple-500/80 h-full transition-all duration-1000" style={{ width: `${((stats.tokens_output || 0) / ((stats.tokens_input || 0) + (stats.tokens_output || 0) || 1)) * 100}%` }}></div>
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

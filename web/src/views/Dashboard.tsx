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

    const Skeleton = ({ className = "" }: { className?: string }) => (
        <div className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`}></div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">Activity Overview</h2>
                    <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium max-w-lg">View statistics and usage data for your assistant.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { title: "Activity", desc: "Conversations", val: userStats?.chats_created, icon: "chat_alt", color: "text-zinc-700" },
                    { title: "Exchange", desc: "Messages", val: userStats?.messages_sent, icon: "send", color: "text-emerald-700/50" },
                    { title: "Input", desc: "Tokens Received", val: userStats?.tokens_input, icon: "terminal", color: "text-amber-700/50" },
                    { title: "Output", desc: "Tokens Generated", val: userStats?.tokens_output, icon: "vault", color: "text-purple-700/50" }
                ].map((stat, i) => (
                    <Card key={i} title={stat.title} description={stat.desc}>
                        <div className="flex items-center justify-between mb-2">
                            {isLoading && !userStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="text-2xl font-black text-zinc-100 tracking-tight font-mono">{stat.val?.toLocaleString() ?? 0}</div>
                            )}
                            <Icon name={stat.icon} className={stat.color} size={20} />
                        </div>
                        <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Total {stat.desc}</div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8">
                <Card title="Efficiency" description="Token Ratio">
                    {isLoading && !userStats ? (
                        <div className="space-y-4 pt-2">
                            <Skeleton className="h-4 w-full rounded-full" />
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex mt-2">
                                <div className="bg-amber-500/80 h-full transition-all duration-1000" style={{ width: `${((userStats?.tokens_input || 0) / ((userStats?.tokens_input || 0) + (userStats?.tokens_output || 0) || 1)) * 100}%` }}></div>
                                <div className="bg-purple-500/80 h-full transition-all duration-1000" style={{ width: `${((userStats?.tokens_output || 0) / ((userStats?.tokens_input || 0) + (userStats?.tokens_output || 0) || 1)) * 100}%` }}></div>
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
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

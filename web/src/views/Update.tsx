import React, { useState, useEffect } from "react";
import { updateService } from "../services/updateService";
import type { UpdateStatus, UpdateEntry } from "../types";
import { Card } from "../components/cards";
import { Icon } from "../components/icons";

export default function UpdateView() {
    const [status, setStatus] = useState<UpdateStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [lastOutput, setLastOutput] = useState<{ stdout: string; stderr: string } | null>(null);

    const fetchStatus = async () => {
        try {
            const data = await updateService.getStatusAsAdmin();
            setStatus(data);
        } catch (error) {
            console.error("Failed to fetch update status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleCheck = async () => {
        setLoading(true);
        await fetchStatus();
    };

    const handleUpdate = async () => {
        if (!window.confirm("Are you sure you want to perform a git pull? This will overwrite local changes if any.")) return;
        setUpdating(true);
        try {
            const result = await updateService.performUpdateAsAdmin();
            setLastOutput(result);
            await fetchStatus();
        } catch (error: any) {
            alert("Update failed: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSwitch = async (channel: string) => {
        setSwitching(true);
        try {
            await updateService.switchChannelAsAdmin(channel);
            await fetchStatus();
        } catch (error: any) {
            alert("Switch failed: " + error.message);
        } finally {
            setSwitching(false);
        }
    };

    const hasUpdates = status?.updates && status.updates.length > 0;
    const isDevelopment = status?.channel === 'development';

    const Skeleton = ({ className = "" }: { className?: string }) => (
        <div className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`}></div>
    );

    return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">Updates</h2>
                        <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium max-w-lg">Keep your assistant up to date with the latest features and security improvements.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCheck}
                        disabled={loading}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} />
                        Refresh Status
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg active:scale-95 ${hasUpdates || isDevelopment
                            ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            }`}
                    >
                        <Icon name="check" size={14} />
                        {updating ? "Updating..." : "Install Updates"}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Current Status" description="Your local version details">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Version</span>
                            {loading && !status ? (
                                <Skeleton className="h-5 w-16" />
                            ) : (
                                <span className="text-sm font-mono text-zinc-300 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/30">
                                    {status?.currentVersion ? `v${status.currentVersion}` : "1.0.0"}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Branch</span>
                            {loading && !status ? (
                                <Skeleton className="h-4 w-20" />
                            ) : (
                                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {status?.currentBranch || "master"}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                <Card title="Update Channel" description="System delivery source">
                    <div className="space-y-4">
                        {loading && !status ? (
                            <Skeleton className="h-10 w-full rounded-xl" />
                        ) : (
                            <div className="relative group">
                                <select
                                    value={status?.channel || "stable"}
                                    onChange={(e) => {
                                        const newChannel = e.target.value;
                                        if (newChannel !== status?.channel) {
                                            if (window.confirm(`Switching to ${newChannel.toUpperCase()} channel will update your system to that branch. Continue?`)) {
                                                handleSwitch(newChannel);
                                            }
                                        }
                                    }}
                                    disabled={switching}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold px-4 py-3 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer hover:border-zinc-700"
                                >
                                    <option value="stable">STABLE (Recommended)</option>
                                    <option value="nightly">NIGHTLY (Testing)</option>
                                    <option value="development">DEVELOPMENT (Experimental)</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-600">
                                    <Icon name="plus" size={14} className="rotate-45" />
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-zinc-600 font-medium">
                            {status?.channel === 'stable' && "Receiving validated, reliable releases only."}
                            {status?.channel === 'nightly' && "Daily snapshots with latest features, may have minor bugs."}
                            {status?.channel === 'development' && "Bleeding edge code directly from the repository."}
                            {loading && !status && <Skeleton className="h-3 w-3/4 mt-1" />}
                        </p>
                    </div>
                </Card>

                <Card title="Available Updates" description="New versions for your system">
                    <div className="flex flex-col items-center justify-center py-4 gap-3">
                        <div className={`text-4xl font-black font-mono transition-all ${hasUpdates ? "text-amber-500" : "text-emerald-500"}`}>
                            {status?.updates?.length || 0}
                        </div>
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">New Versions Available</div>
                        {hasUpdates ? (
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full animate-bounce">
                                Action Required
                            </div>
                        ) : (
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-full">
                                Up to Date
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {lastOutput && (
                <Card title="Update Result" description="Details from the last update process">
                    <pre className="bg-black/40 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 overflow-x-auto max-h-40">
                        {lastOutput.stdout || "System update completed successfully."}
                        {lastOutput.stderr && `\n\nERRORS DETECTED:\n${lastOutput.stderr}`}
                    </pre>
                </Card>
            )}

            <div>
                <header className="mb-8">
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-3">
                        Release History
                        {hasUpdates && (
                            <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {status?.updates.length} Pending
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1 font-medium">Record of recent system improvements.</p>
                </header>

                <div className="space-y-4">
                    {loading && !status ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-zinc-900/40 border border-zinc-800/40 p-6 rounded-2xl">
                                <div className="flex justify-between mb-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            </div>
                        ))
                    ) : status?.updates && status.updates.length > 0 ? (
                        status.updates.map((update: UpdateEntry) => (
                            <div key={update.version} className="group bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/50 p-6 rounded-2xl transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-zinc-100 font-bold text-lg">{update.name}</h4>
                                            <span className="text-xs font-mono text-zinc-500">v{update.version}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${update.type === 'securitypatch' ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
                                                update.type === 'hotfix' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                                                    'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                {update.type || 'standard update'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Icon name="check" size={18} />
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {update.changes.map((change: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm text-zinc-400">
                                            <div className="w-1 h-1 rounded-full bg-zinc-700 mt-2 shrink-0"></div>
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-3xl opacity-30">
                            <Icon name="check" size={32} className="text-zinc-600 mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">System is fully up to date</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

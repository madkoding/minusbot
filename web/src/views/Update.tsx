import React, { useState, useEffect } from "react";
import { updateService } from "../services/updateService";
import type { UpdateStatus, UpdateEntry } from "../services/updateService";
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
            const data = await updateService.getStatus();
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
            const result = await updateService.performUpdate();
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
            await updateService.switchChannel(channel);
            await fetchStatus();
        } catch (error: any) {
            alert("Switch failed: " + error.message);
        } finally {
            setSwitching(false);
        }
    };

    if (loading && !status) {
        return <div className="animate-pulse text-zinc-500 font-bold uppercase tracking-widest text-center py-20">Scanning for delta packages...</div>;
    }

    const hasUpdates = status?.updates && status.updates.length > 0;
    const isDevelopment = status?.channel === 'development';

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">System Core Update</h2>
                        <div className="h-px w-20 bg-zinc-900 ml-4 opacity-50 hidden md:block"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">Manage deployment branches and synchronize local repository with remote delta.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCheck}
                        disabled={loading}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
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
                        {updating ? "Synchronizing..." : "Initialize Update"}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Repository" description="Current active state">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Version</span>
                            <span className="text-sm font-mono text-zinc-300 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/30">v{status?.currentVersion}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Branch</span>
                            <span className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                {status?.currentBranch}
                            </span>
                        </div>
                    </div>
                </Card>

                <Card title="Delta Channel" description="Update stream source">
                    <div className="flex flex-col gap-2">
                        {['stable', 'nightly', 'development'].map((ch) => (
                            <button
                                key={ch}
                                onClick={() => handleSwitch(ch)}
                                disabled={switching || status?.channel === ch}
                                className={`w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all border ${status?.channel === ch
                                    ? "bg-zinc-100 border-white text-zinc-950 shadow-md"
                                    : "bg-zinc-900/30 border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span>{ch}</span>
                                    {status?.channel === ch && <Icon name="check" size={10} />}
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>

                <Card title="Integrity" description="Package availability">
                    <div className="flex flex-col items-center justify-center py-4 gap-3">
                        <div className={`text-4xl font-black font-mono transition-all ${hasUpdates ? "text-amber-500" : "text-emerald-500"}`}>
                            {status?.updates?.length || 0}
                        </div>
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">New Versions Available</div>
                        {hasUpdates && (
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full animate-bounce">
                                Critical Updates Pending
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {lastOutput && (
                <Card title="Last Execution Log" description="Terminal output from previous pull">
                    <pre className="bg-black/40 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 overflow-x-auto max-h-40">
                        {lastOutput.stdout || "No output."}
                        {lastOutput.stderr && `\n\nERRORS:\n${lastOutput.stderr}`}
                    </pre>
                </Card>
            )}

            <div>
                <header className="mb-8">
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-3">
                        Changelog History
                        {hasUpdates && (
                            <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {status?.updates.length} Pending
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1 font-medium">Detailed synchronization logs of all semantic versions released on this channel.</p>
                </header>

                <div className="space-y-4">
                    {status?.updates && status.updates.length > 0 ? (
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
                                                {update.type || 'update'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Icon name="plus" size={18} />
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {update.changes.map((change, i) => (
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
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">System Fully Synchronized</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

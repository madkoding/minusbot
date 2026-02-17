import React, { useEffect } from "react";
import { Icon } from "../components/icons";
import { useVault } from "../hooks/useVault";

export default function VaultView({ apiPath = '/user/vault' }: { apiPath?: string }) {
    const {
        vaults,
        selectedVault,
        keys,
        fetchVaults,
        fetchKeys,
        updateVaultKey,
        deleteVaultKey,
        isLoading
    } = useVault(apiPath);

    const isGlobal = apiPath.includes('admin');

    useEffect(() => {
        const load = async () => {
            const list = await fetchVaults();
            if (list.length > 0 && !selectedVault) {
                fetchKeys(list[0]);
            }
        };
        load();
    }, [apiPath, fetchVaults, fetchKeys, selectedVault]);

    const handleUpdateKey = async (key: string) => {
        const val = prompt(`Enter new value for ${key}:`);
        if (val === null) return;
        await updateVaultKey(selectedVault!, key, val);
    };

    const handleRemoveKey = async (key: string) => {
        if (!confirm(`Wipe value for ${key}?`)) return;
        await deleteVaultKey(selectedVault!, key);
    };

    const handleRegisterItem = async () => {
        const k = prompt("Register Key Name:");
        if (k) handleUpdateKey(k);
    };

    const Skeleton = ({ className = "" }: { className?: string }) => (
        <div className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`}></div>
    );

    return (
        <div className="space-y-6 md:space-y-8 flex flex-col min-h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">{isGlobal ? 'Global' : 'Storage'} Vault</h2>
                    <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium max-w-lg">Securely store your API keys, secrets and sensitive configuration.</p>
            </header>

            <div className="flex-1 min-h-[500px] bg-[#080808] border border-zinc-900 rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl mb-8">
                {/* Sidebar / Unit Selector */}
                <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col bg-zinc-900/10 shrink-0">
                    <div className="p-6 border-b border-zinc-900/50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Storage Units</h3>
                    </div>
                    <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-3 md:p-2 space-x-2 md:space-x-0 md:space-y-1 custom-scrollbar shrink-0">
                        {isLoading && vaults.length === 0 ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="px-4 py-3">
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ))
                        ) : (
                            vaults.map(v => (
                                <button
                                    key={v}
                                    onClick={() => fetchKeys(v)}
                                    className={`flex items-center gap-3 px-4 md:px-5 py-3 md:py-3 rounded-2xl transition-all duration-200 whitespace-nowrap group ${selectedVault === v
                                        ? 'bg-zinc-100 text-zinc-950 font-black shadow-xl scale-[1.02] z-10'
                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50 font-bold'
                                        }`}
                                >
                                    <Icon name="vault" size={14} className={selectedVault === v ? 'text-zinc-950' : 'text-zinc-700 group-hover:text-zinc-400'} />
                                    <span className="text-xs tracking-tight">{v}</span>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Content Table */}
                <main className="flex-1 flex flex-col min-w-0 bg-black/40">
                    {selectedVault ? (
                        <>
                            <div className="p-6 md:p-8 border-b border-zinc-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base md:text-lg font-black text-zinc-100 tracking-tight">{selectedVault}.vault</h3>
                                        <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 text-[8px] font-black uppercase tracking-widest text-zinc-600 border border-zinc-800">Decrypted</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.2em]">Key index</p>
                                </div>
                                <button
                                    onClick={handleRegisterItem}
                                    className="w-full sm:w-auto px-5 py-3 bg-zinc-100 hover:bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)] active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <Icon name="plus" size={12} className="group-hover:rotate-90 transition-transform" />
                                    Register Item
                                </button>
                            </div>

                            <div className="flex-1 overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-zinc-900 text-zinc-600">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] w-[45%]">Resource Key</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900/50">
                                        {isLoading && Object.keys(keys).length === 0 ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <tr key={i}>
                                                    <td className="px-8 py-6"><Skeleton className="h-4 w-3/4" /></td>
                                                    <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-8 py-6 text-right flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            Object.entries(keys).map(([k, hasValue]) => (
                                                <tr key={k} className="group hover:bg-zinc-900/30 transition-all duration-200">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-600 group-hover:text-zinc-400 group-hover:border-zinc-700 transition-colors">
                                                                <Icon name="terminal" size={14} />
                                                            </div>
                                                            <span className="text-xs font-bold text-zinc-300 font-mono tracking-tight">{k}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${hasValue ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-zinc-800 shadow-[0_0_12px_rgba(39,39,42,0.5)]'}`}></div>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${hasValue ? 'text-zinc-100' : 'text-zinc-600'}`}>
                                                                {hasValue ? 'Configured' : 'Empty'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-10 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform lg:translate-x-2 lg:group-hover:translate-x-0">
                                                            <button
                                                                onClick={() => handleUpdateKey(k)}
                                                                className="p-2.5 text-zinc-500 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700/50"
                                                                title="Set Value"
                                                            >
                                                                <Icon name="settings" size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveKey(k)}
                                                                className="p-2.5 text-zinc-500 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                                                title="Wipe Data"
                                                            >
                                                                <Icon name="trash" size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        {Object.keys(keys).length === 0 && !isLoading && (
                                            <tr>
                                                <td colSpan={3} className="py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-20">
                                                        <Icon name="vault" size={40} className="mb-4" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No keys found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-zinc-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                <div className="relative p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-2xl">
                                    <Icon name="vault" size={64} className="text-zinc-800" />
                                </div>
                            </div>
                            <h3 className="text-zinc-200 font-bold mb-2">Vault Locked</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 max-w-[200px] leading-loose">Select a storage unit to view your keys.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

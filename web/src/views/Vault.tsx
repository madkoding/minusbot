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
        <div className="space-y-8 max-w-6xl mx-auto h-full flex flex-col">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">{isGlobal ? 'Global' : 'Secure'} Vault</h2>
                    <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Secure peripheral credentials and protected environment variables.</p>
            </header>

            <div className="flex-1 min-h-0 bg-[#080808] border border-zinc-900 rounded-[2.5rem] overflow-hidden flex shadow-2xl">
                {/* Small Sidebar */}
                <aside className="w-56 border-r border-zinc-900 flex flex-col bg-zinc-900/10">
                    <div className="p-5 border-b border-zinc-900/50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Storage Units</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {isLoading && vaults.length === 0 ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="px-4 py-2.5">
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ))
                        ) : (
                            vaults.map(v => (
                                <button
                                    key={v}
                                    onClick={() => fetchKeys(v)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-150 ${selectedVault === v
                                        ? 'bg-zinc-100 text-zinc-950 font-bold shadow-lg'
                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 font-medium'
                                        }`}
                                >
                                    <Icon name="vault" size={14} />
                                    <span className="text-xs truncate">{v}</span>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Content Table */}
                <main className="flex-1 flex flex-col min-w-0 bg-black/20">
                    {selectedVault ? (
                        <>
                            <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/5">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-200">{selectedVault}.vault</h3>
                                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Decrypted key index</p>
                                </div>
                                <button
                                    onClick={handleRegisterItem}
                                    className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    <Icon name="plus" size={12} />
                                    Register Item
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-900/50 text-zinc-500">
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest w-1/2">Environment Variable</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Integrity Status</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900/30">
                                        {isLoading && Object.keys(keys).length === 0 ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <tr key={i}>
                                                    <td className="px-8 py-5"><Skeleton className="h-4 w-3/4" /></td>
                                                    <td className="px-8 py-5"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-8 py-5 text-right flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            Object.entries(keys).map(([k, hasValue]) => (
                                                <tr key={k} className="group hover:bg-zinc-900/20 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <Icon name="terminal" size={14} className="text-zinc-700" />
                                                            <span className="text-xs font-bold text-zinc-300 font-mono tracking-tight">{k}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${hasValue ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`}></div>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${hasValue ? 'text-zinc-100' : 'text-zinc-700'}`}>
                                                                {hasValue ? 'Configured' : 'Missing'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleUpdateKey(k)}
                                                                className="p-2 text-zinc-600 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-all"
                                                                title="Overwrite"
                                                            >
                                                                <Icon name="settings" size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveKey(k)}
                                                                className="p-2 text-zinc-600 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all"
                                                                title="Wipe"
                                                            >
                                                                <Icon name="trash" size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        {Object.keys(keys).length === 0 && !isLoading && (
                                            <tr>
                                                <td colSpan={3} className="py-20 text-center italic text-zinc-800 text-[10px] font-black uppercase tracking-widest">
                                                    Empty Registry
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-800 italic">
                            <Icon name="vault" size={48} className="mb-4 opacity-5" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Lock engaged. Select unit.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

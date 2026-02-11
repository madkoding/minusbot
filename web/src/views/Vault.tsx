import React, { useState, useEffect } from "react";
import { Card, Button, Icon } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function VaultView({ apiPath = '/admin/vault' }: { apiPath?: string }) {
    const [vaults, setVaults] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [keys, setKeys] = useState<any>({});
    const isGlobal = apiPath.includes('admin');

    const load = async () => {
        try {
            const res = await api.get(apiPath);
            setVaults(res.data);
        } catch {
            setVaults([]);
        }
    };

    const loadKeys = async (id: string) => {
        const res = await api.get(`${apiPath}/${id}`);
        setKeys(res.data);
        setSelected(id);
    };

    useEffect(() => { load(); }, [apiPath]);

    const updateKey = async (key: string) => {
        const val = prompt(`New value for ${key}:`);
        if (val === null) return;
        await api.put(`${apiPath}/${selected}`, { key, value: val });
        loadKeys(selected!);
    };

    const removeKey = async (key: string) => {
        if (!confirm(`Remove ${key} from vault?`)) return;
        try {
            await api.delete(`${apiPath}/${selected}/${key}`);
            loadKeys(selected!);
        } catch {
            alert("Delete failed");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 max-w-6xl mx-auto h-[calc(100vh-12rem)]">
            <div className="md:col-span-4 space-y-6 flex flex-col h-full">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-100">{isGlobal ? 'Global' : 'Personal'} Secrets</h2>
                    <p className="text-zinc-500 mt-1">Encrypted storage modules.</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {vaults.map(v => (
                        <button
                            key={v}
                            onClick={() => loadKeys(v)}
                            className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${selected === v
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                                : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300'
                                }`}
                        >
                            <span className="text-sm font-bold tracking-tight">{v}.vault</span>
                            <div className={`w-1 h-1 rounded-full transition-all ${selected === v ? 'bg-zinc-100 shadow-[0_0_8px_white]' : 'bg-transparent'}`}></div>
                        </button>
                    ))}
                    {vaults.length === 0 && (
                        <p className="text-xs text-zinc-600 italic px-4">No vaults found.</p>
                    )}
                </div>
            </div>

            <div className="md:col-span-8 h-full overflow-hidden">
                {selected ? (
                    <Card title={`${selected}.vault`} description="Credential mapping" className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {Object.keys(keys).map(k => (
                                <div key={k} className="flex justify-between items-center p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/30 group">
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Key Pair</div>
                                        <div className="text-sm font-bold text-zinc-200 truncate">{k}</div>
                                        <div className="text-[10px] font-mono text-zinc-800 group-hover:text-zinc-700 transition-colors text-xs italic">Encrypted Value</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => updateKey(k)} className="rounded-xl">Update</Button>
                                        <button onClick={() => removeKey(k)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-700 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 p-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
                            <Icon name="vault" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-500">Vault Locked</h3>
                        <p className="max-w-[200px] text-xs mt-2 font-medium">Select a vault from the list to synchronize credentials.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Button, Input } from "../components/ui";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { useIntegrations } from "../hooks/useIntegrations";

export default function IntegrationsView({ apiPath = '/user/integrations' }: { apiPath?: string }) {
    const {
        available,
        configs,
        isLoading,
        error,
        fetchIntegrations,
        saveSettings,
        saveSecrets,
        deleteIntegration
    } = useIntegrations(apiPath);

    const [editing, setEditing] = useState<any>(null);
    const [editData, setEditData] = useState<any>({});
    const [editSecrets, setEditSecrets] = useState<any>({});
    const isAdmin = apiPath.includes('admin');

    useEffect(() => { fetchIntegrations(); }, [apiPath, fetchIntegrations]);

    const handleEdit = (integration: any) => {
        setEditing(integration);
        setEditData(configs[integration.id] || {});
        setEditSecrets({});
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async () => {
        const success = await saveSettings(editing.id, editData, isAdmin);
        if (success) {
            const secretSuccess = await saveSecrets(editing.id, editSecrets, isAdmin, editing);
            if (secretSuccess) {
                setEditing(null);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove all configurations for this integration.")) return;
        await deleteIntegration(id);
    };

    if (editing) {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8 flex items-start gap-4">
                        <button
                            onClick={() => setEditing(null)}
                            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl transition-all active:scale-95 shadow-lg"
                        >
                            <Icon name="logout" size={20} className="rotate-180" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 truncate">{editing.name}</h2>
                                <div className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[8px] font-black uppercase tracking-widest text-zinc-500">Config</div>
                            </div>
                            <p className="text-xs md:text-sm text-zinc-500 line-clamp-2 md:line-clamp-none">{editing.description}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6 md:p-8 border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">General Settings</h4>
                                    <div className="grid gap-5">
                                        {editing.fields?.map((field: any) => (
                                            <div key={field.id} className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-xs font-bold text-zinc-400">{field.label}</label>
                                                    {field.required && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/50">Required</span>}
                                                </div>
                                                {field.type === 'boolean' ? (
                                                    <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/40">
                                                        <input
                                                            type="checkbox"
                                                            checked={editData[field.id] ?? field.default ?? false}
                                                            onChange={(e) => setEditData({ ...editData, [field.id]: e.target.checked })}
                                                            className="w-5 h-5 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-100 focus:ring-zinc-500"
                                                        />
                                                        <span className="text-xs text-zinc-500 font-medium leading-relaxed">{field.description}</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <Input
                                                            value={editData[field.id] ?? field.default ?? ''}
                                                            onChange={(e) => setEditData({ ...editData, [field.id]: e.target.value })}
                                                            placeholder={field.placeholder || field.description}
                                                            className="bg-zinc-900/50 border-zinc-800/40 h-11 md:h-12"
                                                        />
                                                        {field.description && <p className="text-[10px] text-zinc-600 font-medium ml-1 italic">{field.description}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {editing.vaultKeys && (
                                    <div className="space-y-4 pt-8 border-t border-zinc-900">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 underline underline-offset-4 decoration-zinc-800">Secrets & Keys</h4>
                                            <Icon name="vault" size={12} className="text-amber-500/50" />
                                        </div>
                                        <div className="grid gap-5">
                                            {editing.vaultKeys.map((key: string) => (
                                                <div key={key} className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-tighter flex items-center gap-2">
                                                        {key.replace(/_/g, ' ')}
                                                    </label>
                                                    <Input
                                                        type="password"
                                                        value={editSecrets[key] || ''}
                                                        onChange={(e) => setEditSecrets({ ...editSecrets, [key]: e.target.value })}
                                                        placeholder="••••••••••••••••"
                                                        className="bg-zinc-900/50 border-zinc-800/40 h-11 md:h-12"
                                                    />
                                                    <p className="text-[10px] text-zinc-700 font-medium ml-1">Stored in encrypted vault.</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3">
                                    <Button variant="secondary" onClick={() => setEditing(null)} className="h-11 md:h-12 order-2 sm:order-1">Discard Changes</Button>
                                    <Button onClick={handleSave} loading={isLoading} className="h-11 md:h-12 order-1 sm:order-2 shadow-xl">Save Changes</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12">
            <div className="space-y-8 md:space-y-12 max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">Integrations</h2>
                            <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium max-w-lg">Connect external services and apps to extend your assistant's capabilities.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
                    {available.map((integration) => {
                        const config = configs[integration.id];
                        const isConfigured = !!config;

                        return (
                            <Card key={integration.id} className={`group border-zinc-900 hover:border-zinc-700/50 transition-all ${isConfigured ? 'bg-zinc-900/10' : 'bg-transparent border-dashed'} p-6 md:p-8 flex flex-col h-full`}>
                                <div className="flex items-start justify-between mb-6 md:mb-8">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${isConfigured ? 'bg-zinc-100 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800/50'}`}>
                                        <Icon name={integration.icon || 'terminal'} size={24} className="md:w-7 md:h-7" />
                                    </div>
                                    {isConfigured && (
                                        <div className="flex gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(integration)} className="p-2.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors">
                                                <Icon name="settings" size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(integration.id)} className="p-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg md:text-xl font-black text-zinc-100 mb-2 truncate tracking-tight">{integration.name}</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-8 flex-1 font-medium italic opacity-70">{integration.description}</p>
                                {!isConfigured ? (
                                    <Button className="w-full rounded-xl h-11 md:h-12 shadow-lg" variant="secondary" onClick={() => handleEdit(integration)}>Setup</Button>
                                ) : (
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Connected</span>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
                {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest text-center">{error}</div>}
            </div>
        </div>
    );
}

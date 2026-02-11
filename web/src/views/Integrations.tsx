import React, { useState, useEffect } from "react";
import { Button, Input } from "../components/ui";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { Modal } from "../components/modals";
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

    return (
        <div className="space-y-10 max-w-6xl mx-auto h-full">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Integrations</h2>
                        <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">Connect external services and neural interfaces.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {available.map((integration) => {
                    const config = configs[integration.id];
                    const isConfigured = !!config;

                    return (
                        <Card key={integration.id} className={`group border-zinc-900 hover:border-zinc-700 transition-all ${isConfigured ? 'bg-zinc-900/20' : 'bg-transparent border-dashed'}`}>
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isConfigured ? 'bg-zinc-100 text-zinc-950 shadow-xl' : 'bg-zinc-900 text-zinc-500'}`}>
                                    <Icon name={integration.icon || 'terminal'} size={24} />
                                </div>
                                {isConfigured && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(integration)} className="p-2 text-zinc-500 hover:text-zinc-100">
                                            <Icon name="settings" size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(integration.id)} className="p-2 text-zinc-500 hover:text-red-500">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-zinc-100 mb-1">{integration.name}</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-6 h-8 line-clamp-2">{integration.description}</p>
                            {!isConfigured ? (
                                <Button className="w-full rounded-xl" variant="secondary" onClick={() => handleEdit(integration)}>Configure</Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Operational</span>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <Modal
                isOpen={!!editing}
                onClose={() => setEditing(null)}
                title={`Configure ${editing?.name}`}
            >
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Configuration</h4>
                        <div className="grid gap-4">
                            {editing?.fields?.map((field: any) => (
                                <div key={field.id} className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 ml-1">{field.label}</label>
                                    {field.type === 'boolean' ? (
                                        <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                                            <input
                                                type="checkbox"
                                                checked={editData[field.id] ?? field.default ?? false}
                                                onChange={(e) => setEditData({ ...editData, [field.id]: e.target.checked })}
                                                className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-zinc-100"
                                            />
                                            <span className="text-xs text-zinc-500">{field.description}</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Input
                                                value={editData[field.id] ?? field.default ?? ''}
                                                onChange={(e) => setEditData({ ...editData, [field.id]: e.target.value })}
                                                placeholder={field.placeholder || field.description}
                                            />
                                            {field.description && <p className="text-[10px] text-zinc-600 font-medium ml-1">{field.description}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {editing?.vaultKeys && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Security Credentials</h4>
                            <div className="grid gap-4">
                                {editing?.vaultKeys?.map((key: string) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</label>
                                        <Input
                                            type="password"
                                            value={editSecrets[key] || ''}
                                            onChange={(e) => setEditSecrets({ ...editSecrets, [key]: e.target.value })}
                                            placeholder="••••••••••••••••"
                                        />
                                        <p className="text-[10px] text-zinc-600 font-medium ml-1 italic">Stored in secure vault.</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-zinc-900 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button onClick={handleSave} loading={isLoading}>Save Configuration</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

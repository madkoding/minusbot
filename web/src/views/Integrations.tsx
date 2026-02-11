import React, { useState, useEffect } from "react";
import { Card, Button, Input, Icon } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function IntegrationsView() {
    const [data, setData] = useState<{ available: any[], configs: Record<string, any> } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"settings" | "secrets">("settings");
    const [settingsForm, setSettingsForm] = useState<any>({});
    const [secretsForm, setSecretsForm] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try {
            const res = await api.get('/user/integrations');
            setData(res.data);
        } catch (e) {
            console.error("Failed to load integrations", e);
        }
    };

    useEffect(() => { load(); }, []);

    const handleConfigure = (id: string) => {
        const schema = data?.available.find(a => a.id === id);
        if (!schema) return;

        setSelectedId(id);
        setActiveTab("settings");
        const config = data?.configs[id] || {};

        // Initialize settings form
        const initialSettings: any = {};
        schema.fields.forEach((f: any) => {
            if (f.type === 'string-array') {
                initialSettings[f.id] = (config[f.id] || []).join(', ');
            } else {
                initialSettings[f.id] = config[f.id] || "";
            }
        });
        setSettingsForm(initialSettings);

        // Initialize secrets form (empty for security)
        const initialSecrets: any = {};
        (schema.vaultKeys || []).forEach((key: string) => {
            initialSecrets[key] = "";
        });
        setSecretsForm(initialSecrets);
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;

        setLoading(true);
        try {
            const schema = data?.available.find(a => a.id === selectedId);
            const processedForm: any = {};

            schema.fields.forEach((f: any) => {
                const val = settingsForm[f.id];
                if (f.type === 'string-array') {
                    processedForm[f.id] = val.split(',').map((s: string) => s.trim()).filter(Boolean);
                } else if (f.type === 'number') {
                    processedForm[f.id] = Number(val);
                } else {
                    processedForm[f.id] = val;
                }
            });

            await api.post(`/user/integrations/${selectedId}`, processedForm);
            await load();
            alert("Settings saved successfully!");
        } catch (e: any) {
            alert("Failed to save settings: " + (e.response?.data || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSecrets = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;

        setLoading(true);
        try {
            const schema = data?.available.find(a => a.id === selectedId);
            const vaultId = schema.vaultId || `integration-${selectedId}`;

            // Save each secret
            for (const [key, value] of Object.entries(secretsForm)) {
                if (value && typeof value === 'string' && value.trim()) {
                    await api.put(`/user/vault/${vaultId}`, { key, value });
                }
            }

            // Clear form
            const clearedSecrets: any = {};
            (schema.vaultKeys || []).forEach((key: string) => {
                clearedSecrets[key] = "";
            });
            setSecretsForm(clearedSecrets);

            alert("Secrets saved successfully!");
        } catch (e: any) {
            alert("Failed to save secrets: " + (e.response?.data || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to disable this integration?")) return;
        try {
            await api.delete(`/user/integrations/${id}`);
            await load();
            if (selectedId === id) setSelectedId(null);
        } catch (e: any) {
            alert("Error: " + (e.response?.data || e.message));
        }
    };

    if (!data) return <div className="text-zinc-500 font-bold uppercase tracking-widest px-8">Mapping Ecosystem...</div>;

    const selectedSchema = data.available.find(a => a.id === selectedId);

    // List view
    if (!selectedId) {
        return (
            <div className="space-y-10 max-w-6xl mx-auto h-full">
                <header>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Integrations</h2>
                        <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">Bridge your intelligence modules with external platforms.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.available.map((integration) => {
                        const isEnabled = !!data.configs[integration.id];
                        return (
                            <Card
                                key={integration.id}
                                className={`p-6 transition-all border-2 ${isEnabled ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-zinc-800/50 bg-zinc-950/50'}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-inner group-hover:scale-105 transition-transform">
                                            {integration.id === 'telegram' && <Icon name="chat_alt" size={24} />}
                                            {integration.id === 'serpapi' && <Icon name="search" size={24} />}
                                            {integration.id !== 'telegram' && integration.id !== 'serpapi' && <Icon name="settings" size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-zinc-100 text-lg tracking-tight">{integration.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isEnabled ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                                    {isEnabled ? 'Operational' : 'Disconnected'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-medium italic min-h-[32px]">{integration.description}</p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleConfigure(integration.id)}
                                        className="flex-1 rounded-xl h-10 text-sm"
                                        variant={isEnabled ? "secondary" : "primary"}
                                    >
                                        {isEnabled ? "Configure" : "Setup"}
                                    </Button>
                                    {isEnabled && (
                                        <button
                                            onClick={() => handleDelete(integration.id)}
                                            className="px-3 text-zinc-700 hover:text-red-500 transition-colors rounded-xl border border-zinc-800 hover:border-red-500/20"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Detail view with tabs
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => setSelectedId(null)}
                    className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-100">{selectedSchema?.name}</h2>
                    <p className="text-sm text-zinc-500">{selectedSchema?.description}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab("settings")}
                    className={`px-4 py-2 font-bold text-sm transition-all ${activeTab === "settings" ? "text-zinc-100 border-b-2 border-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Settings
                </button>
                {selectedSchema?.vaultKeys && selectedSchema.vaultKeys.length > 0 && (
                    <button
                        onClick={() => setActiveTab("secrets")}
                        className={`px-4 py-2 font-bold text-sm transition-all ${activeTab === "secrets" ? "text-zinc-100 border-b-2 border-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        Secrets
                    </button>
                )}
            </div>

            {/* Settings Tab */}
            {activeTab === "settings" && (
                <Card className="border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        {selectedSchema?.fields.map((field: any) => (
                            <div key={field.id} className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">{field.label}</label>
                                <Input
                                    placeholder={field.placeholder || field.description}
                                    value={settingsForm[field.id]}
                                    onChange={(e: any) => setSettingsForm({ ...settingsForm, [field.id]: e.target.value })}
                                    className="bg-zinc-900/50 border-zinc-800/40"
                                    required
                                />
                                {field.description && <p className="text-[10px] text-zinc-600 font-medium italic">{field.description}</p>}
                            </div>
                        ))}
                        <div className="pt-4">
                            <Button type="submit" className="w-full rounded-xl h-12" loading={loading}>Save Settings</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Secrets Tab */}
            {activeTab === "secrets" && (
                <Card className="border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md">
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-xs text-amber-200 font-medium">🔒 Secrets are encrypted and never displayed after saving. Enter new values to update.</p>
                    </div>
                    <form onSubmit={handleSaveSecrets} className="space-y-6">
                        {selectedSchema?.vaultKeys?.map((key: string) => (
                            <div key={key} className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">{key}</label>
                                <Input
                                    type="password"
                                    placeholder={`Enter ${key}`}
                                    value={secretsForm[key]}
                                    onChange={(e: any) => setSecretsForm({ ...secretsForm, [key]: e.target.value })}
                                    className="bg-zinc-900/50 border-zinc-800/40"
                                />
                            </div>
                        ))}
                        <div className="pt-4">
                            <Button type="submit" className="w-full rounded-xl h-12" loading={loading}>Save Secrets</Button>
                        </div>
                    </form>
                </Card>
            )}
        </div>
    );
}

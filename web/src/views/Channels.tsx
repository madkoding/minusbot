import React, { useState, useEffect } from "react";
import { Button, Input } from "../components/ui";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { useChannels } from "../hooks/useChannels";

export default function ChannelsView({ apiPath = "/user/channels" }: { apiPath?: string }) {
    const {
        channels,
        selectedChannel,
        isLoading,
        error,
        fetchChannels,
        fetchChannelConfig,
        saveChannel,
        deleteChannel,
        setSelectedChannel
    } = useChannels(apiPath);

    const [settingsForm, setSettingsForm] = useState<any>({});
    const [secretsForm, setSecretsForm] = useState<any>({});
    const [enabled, setEnabled] = useState(false);

    const isAdmin = apiPath.startsWith('/admin');

    useEffect(() => { fetchChannels(); }, [apiPath, fetchChannels]);

    useEffect(() => {
        if (selectedChannel) {
            if (isAdmin) {
                setSecretsForm(selectedChannel.secrets || {});
                setSettingsForm({});
                setEnabled(true);
            } else {
                setEnabled(selectedChannel.enabled);

                const initialSettings: any = {};
                selectedChannel.schema.fields.forEach((f: any) => {
                    if (!f.secret) {
                        if (f.type === 'string-array') {
                            initialSettings[f.id] = (selectedChannel.settings[f.id] || []).join(', ');
                        } else {
                            initialSettings[f.id] = selectedChannel.settings[f.id] || "";
                        }
                    }
                });
                setSettingsForm(initialSettings);

                const initialSecrets: any = {};
                selectedChannel.schema.fields.forEach((f: any) => {
                    if (f.secret) {
                        initialSecrets[f.id] = "";
                    }
                });
                setSecretsForm(initialSecrets);
            }
        }
    }, [selectedChannel, isAdmin]);

    const handleConfigure = (id: string) => {
        fetchChannelConfig(id, isAdmin);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChannel) return;

        const data: any = {};
        if (isAdmin) {
            data.secrets = secretsForm;
        } else {
            const processedSettings: any = {};
            const processedSecrets: any = {};

            selectedChannel.schema.fields.forEach((f: any) => {
                if (f.secret) {
                    const val = secretsForm[f.id];
                    if (val && val.trim()) {
                        processedSecrets[f.id] = val;
                    }
                } else {
                    const val = settingsForm[f.id];
                    if (f.type === 'string-array') {
                        processedSettings[f.id] = val.split(',').map((s: string) => s.trim()).filter(Boolean);
                    } else if (f.type === 'number') {
                        processedSettings[f.id] = Number(val);
                    } else if (f.type === 'boolean') {
                        processedSettings[f.id] = Boolean(val);
                    } else {
                        processedSettings[f.id] = val;
                    }
                }
            });

            data.enabled = enabled;
            data.settings = processedSettings;
            data.secrets = processedSecrets;
        }

        const success = await saveChannel(selectedChannel.schema?.id || selectedChannel.id, data, isAdmin);
        if (success) {
            alert("Channel configuration saved successfully!");
            setSelectedChannel(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (isAdmin) return;
        if (!confirm("Are you sure you want to disable this channel?")) return;
        await deleteChannel(id);
    };

    if (!channels && isLoading) return <div className="text-zinc-500 font-bold uppercase tracking-widest px-8">Loading Channels...</div>;

    if (!selectedChannel) {
        return (
            <div className="space-y-10 max-w-6xl mx-auto h-full">
                <header>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">{isAdmin ? 'Global ' : ''}Communication Channels</h2>
                        <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">
                        {isAdmin
                            ? 'Configure global credentials for all communication platforms.'
                            : 'Connect your assistant to external communication platforms.'}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {channels && channels.length > 0 ? channels.map((channel) => {
                        const isEnabled = isAdmin || channel.enabled;
                        const isConfigured = isAdmin || channel.configured;
                        return (
                            <Card
                                key={channel.id}
                                className={`p-6 transition-all border-2 ${isEnabled ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-zinc-800/50 bg-zinc-950/50'}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-inner group-hover:scale-105 transition-transform">
                                            <Icon name={channel.icon || "globe"} size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-zinc-100 text-lg tracking-tight">{channel.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isEnabled ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                                    {isAdmin ? 'System' : (isEnabled ? 'Active' : 'Inactive')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-medium italic min-h-[32px]">{channel.description}</p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleConfigure(channel.id)}
                                        className="flex-1 rounded-xl h-10 text-sm"
                                        variant={isConfigured ? "secondary" : "primary"}
                                    >
                                        {isAdmin ? "Global Secrets" : (isConfigured ? "Configure" : "Setup")}
                                    </Button>
                                    {!isAdmin && isConfigured && (
                                        <button
                                            onClick={() => handleDelete(channel.id)}
                                            className="px-3 text-zinc-700 hover:text-red-500 transition-colors rounded-xl border border-zinc-800 hover:border-red-500/20"
                                        >
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </div>
                            </Card>
                        );
                    }) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-zinc-600 text-sm font-medium">No channels available</p>
                        </div>
                    )}
                </div>
                {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => setSelectedChannel(null)}
                    className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                    <Icon name="logout" size={20} className="rotate-180" />
                </button>
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-100">{selectedChannel?.schema?.name}</h2>
                    <p className="text-sm text-zinc-500">{selectedChannel?.schema?.description}</p>
                </div>
            </div>

            {!isAdmin && (
                <Card className="border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-zinc-100">Channel Status</h3>
                            <p className="text-xs text-zinc-500">Enable or disable this communication channel</p>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </Card>
            )}

            <Card className="border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md">
                <form onSubmit={handleSave} className="space-y-6">
                    {!isAdmin && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Configuration</h3>

                            {selectedChannel?.schema?.fields?.filter((f: any) => !f.secret).map((field: any) => (
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
                        </div>
                    )}

                    {selectedChannel?.schema?.fields?.some((f: any) => f.secret) && (
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">{isAdmin ? "Global Secrets" : "Secrets"}</h3>
                                <Icon name="vault" size={14} className="text-amber-500" />
                            </div>
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-xs text-amber-200 font-medium">
                                    {isAdmin
                                        ? 'Global secrets are used when users do not provide their own.'
                                        : 'Secrets override admin defaults. Leave empty to use global configuration.'}
                                </p>
                            </div>

                            {selectedChannel?.schema?.fields?.filter((f: any) => f.secret).map((field: any) => (
                                <div key={field.id} className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">{field.label}</label>
                                    <Input
                                        type={isAdmin ? "text" : "password"}
                                        placeholder={field.placeholder || `Enter ${field.label}`}
                                        value={secretsForm[field.id]}
                                        onChange={(e: any) => setSecretsForm({ ...secretsForm, [field.id]: e.target.value })}
                                        className="bg-zinc-900/50 border-zinc-800/40"
                                    />
                                    {field.description && <p className="text-[10px] text-zinc-600 font-medium italic">{field.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" className="w-full rounded-xl h-12" loading={isLoading}>Save {isAdmin ? 'Global Secrets' : 'Configuration'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Button, Input } from "../components/ui";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { Skeleton } from "../components/ui";
import { useChannels, useChannelsAsAdmin } from "../hooks/useChannels";

export default function ChannelsView({ mode = "user" }: { mode?: "user" | "admin" }) {
    const isAdmin = mode === "admin";
    const userHook = useChannels();
    const adminHook = useChannelsAsAdmin();

    const {
        channels,
        selectedChannel,
        isLoading,
        fetchChannels,
        fetchChannelConfig,
        toggleChannel,
        saveChannel,
        setSelectedChannel
    } = isAdmin ? adminHook : userHook;

    const [settingsForm, setSettingsForm] = useState<any>({});
    const [secretsForm, setSecretsForm] = useState<any>({});
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

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
        if (isAdmin) {
            adminHook.fetchChannelConfig(id);
        } else {
            userHook.fetchChannelConfig(id, false);
        }
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

        const success = await saveChannel(selectedChannel.schema?.id || selectedChannel.id, data);
        if (success) {
            alert("Channel configuration saved successfully!");
            setSelectedChannel(null);
        }
    };


    if (!selectedChannel) {
        return (
            <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header>
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">{isAdmin ? 'Global ' : ''}Channels</h2>
                        <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium max-w-lg">
                        {isAdmin
                            ? 'Configure global settings for all users.'
                            : 'Connect your assistant to services like Discord or Telegram.'}
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
                    {channels && channels.length > 0 && channels.map((channel) => {
                        const isEnabled = isAdmin || channel.enabled;
                        const isConfigured = isAdmin || channel.configured;
                        return (
                            <Card
                                key={channel.id}
                                className={`p-6 md:p-8 transition-all border-2 ${isLoading ? 'opacity-70 grayscale' : ''} ${isEnabled ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-zinc-800/50 bg-zinc-950/50 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all ${isEnabled ? 'text-zinc-100 shadow-inner' : 'text-zinc-600'}`}>
                                            <Icon name={channel.icon || "globe"} size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-zinc-100 text-lg tracking-tight">{channel.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isEnabled ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                                    {isAdmin ? 'System' : (isEnabled ? 'Active' : 'Inactive')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isLoading && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-8 font-medium italic min-h-[40px] opacity-70">{channel.description}</p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleConfigure(channel.id)}
                                        className="flex-1 rounded-xl h-11 text-sm font-bold"
                                        variant={isConfigured ? "secondary" : "primary"}
                                    >
                                        {isAdmin ? "Global Settings" : (isConfigured ? "Reconfigure" : "Setup")}
                                    </Button>
                                    {!isAdmin && isConfigured && (
                                        <button
                                            onClick={() => { }}
                                            className="px-3.5 bg-zinc-900 text-zinc-600 hover:text-red-500 transition-colors rounded-xl border border-zinc-800 hover:border-red-500/20 active:scale-95"
                                        >
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}

                    {isLoading && (
                        <>
                            {[1, 2].map(i => (
                                <Card key={`skeleton-${i}`} className="p-6 md:p-8 border-2 border-zinc-800/50 bg-zinc-950/20 border-dashed animate-pulse">
                                    <div className="flex items-center gap-4 mb-6">
                                        <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-2xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-2/3 mb-8" />
                                    <Skeleton className="h-11 w-full rounded-xl" />
                                </Card>
                            ))}
                        </>
                    )}

                    {!isLoading && (!channels || channels.length === 0) && (
                        <div className="col-span-full text-center py-20 bg-zinc-950/50 border border-zinc-900 border-dashed rounded-[2rem]">
                            <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest italic">No channels available</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-3xl mx-auto">
                <div className="mb-10 flex items-start gap-4">
                    <button
                        onClick={() => setSelectedChannel(null)}
                        className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-2xl transition-all active:scale-95 shadow-xl mt-1"
                    >
                        <Icon name="logout" size={20} className="rotate-180" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 truncate italic uppercase">{selectedChannel?.schema?.name}</h2>
                            <div className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[8px] font-black uppercase tracking-widest text-zinc-500">Channel</div>
                        </div>
                        <p className="text-sm text-zinc-500 break-words font-medium">{selectedChannel?.schema?.description}</p>
                    </div>
                </div>

                {!isAdmin && (
                    <Card className="border-emerald-500/10 bg-emerald-500/[0.02] backdrop-blur-md mb-8 p-6 md:p-8">
                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <h3 className="text-base font-black text-zinc-100 uppercase tracking-tight mb-1">Status</h3>
                                <p className="text-xs text-zinc-500 font-medium italic">Enable or disable this channel.</p>
                            </div>
                            <button
                                onClick={() => setEnabled(!enabled)}
                                className={`relative flex-shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner ${enabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition-all duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </Card>
                )}

                <Card className="border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md p-6 md:p-10 mb-8 rounded-[2rem]">
                    <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
                        {!isAdmin && (
                            <div className="space-y-4">
                                <h3 className="text-xs md:text-sm font-bold text-zinc-100 uppercase tracking-widest">Configuration</h3>

                                {selectedChannel?.schema?.fields?.filter((f: any) => !f.secret).map((field: any) => (
                                    <div key={field.id} className="space-y-2">
                                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-500">{field.label}</label>
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
                            <div className="space-y-4 pt-6 md:pt-8 border-t border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs md:text-sm font-bold text-zinc-100 uppercase tracking-widest">{isAdmin ? "Global Secrets" : "Secrets"}</h3>
                                    <Icon name="vault" size={14} className="text-amber-500" />
                                </div>
                                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                    <p className="text-[11px] md:text-xs text-amber-200 font-medium">
                                        {isAdmin
                                            ? 'Global secrets are used when users do not provide their own.'
                                            : 'Secrets override admin defaults. Leave empty to use global configuration.'}
                                    </p>
                                </div>

                                {selectedChannel?.schema?.fields?.filter((f: any) => f.secret).map((field: any) => (
                                    <div key={field.id} className="space-y-2">
                                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-500">{field.label}</label>
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
                            <Button type="submit" className="w-full rounded-xl h-11 md:h-12 text-sm md:text-base" loading={isLoading}>
                                Save {isAdmin ? 'Global Secrets' : 'Configuration'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

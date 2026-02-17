import React, { useEffect } from "react";
import { Button, Input, Skeleton } from "../components/ui";
import { Card } from "../components/cards";
import { Icon } from "../components/icons";
import { useSettings, useSettingsAsAdmin, useSystemSettingsAsAdmin } from "../hooks/useSettings";

export default function SettingsView({ mode = 'user' }: { mode?: 'user' | 'admin' | 'system' }) {
    const isSystem = mode === 'system';
    const isGlobal = mode === 'admin';

    const userHook = useSettings();
    const adminHook = useSettingsAsAdmin();
    const systemHook = useSystemSettingsAsAdmin();

    const { settings, fetchSettings, saveSettings, isLoading } =
        isSystem ? systemHook : (isGlobal ? adminHook : userHook);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: any = {};

        if (isSystem) {
            data.web_port = parseInt(formData.get('web_port') as string);
            data.system_prompt = formData.get('system_prompt');
            if (data.system_prompt === "") data.system_prompt = null;
        } else {
            data.colors = true;
        }

        const success = await saveSettings(data);
        if (success) {
            alert("Configuration updated.");
        }
    };

    const title = isSystem ? "System" : isGlobal ? "Global" : "Personal";
    const subtitle = isSystem ? "Manage server settings." : isGlobal ? "Default settings for all users." : "Manage your personal settings.";

    return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">{title} Settings</h2>
                    <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium max-w-lg">{subtitle}</p>
            </header>

            <Card className="p-4 md:p-8">
                {isLoading && !settings ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="pt-8 flex justify-between items-center border-t border-zinc-800/50">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-10 w-40 rounded-xl" />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="space-y-8">
                        {isSystem ? (
                            <div className="grid grid-cols-1 gap-6">
                                <Input label="Web Interface Port" name="web_port" type="number" defaultValue={(settings as any)?.web_port} />
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Default System Prompt</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const area = document.querySelector('textarea[name="system_prompt"]') as HTMLTextAreaElement;
                                                if (area) area.value = "";
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
                                        >
                                            Reset to Default
                                        </button>
                                    </div>
                                    <textarea
                                        name="system_prompt"
                                        defaultValue={(settings as any)?.system_prompt}
                                        placeholder="Enter custom system prompt..."
                                        className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all resize-none shadow-inner custom-scrollbar"
                                    />
                                    <p className="text-[10px] text-zinc-600 font-medium italic">Clear this field to use the hardcoded default prompt.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                                    <Icon name="cpu" size={32} className="text-zinc-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Provider Management</h4>
                                    <p className="text-xs text-zinc-500 max-w-sm">Model and endpoint configurations are now managed through AI Providers for better flexibility and security.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => window.location.href = '/providers'}
                                    className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Go to AI Providers
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-t border-zinc-800/50">
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                {isSystem ? "Requires server restart" : "Changes take effect immediately"}
                            </p>
                            <Button type="submit" className="rounded-xl px-8 w-full md:w-auto" loading={isLoading}>Save Settings</Button>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
}

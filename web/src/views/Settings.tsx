import React, { useEffect } from "react";
import { Button, Input, Skeleton } from "../components/ui";
import { Card } from "../components/cards";
import { useSettings } from "../hooks/useSettings";

export default function SettingsView({ apiPath = '/user/settings' }: { apiPath?: string }) {
    const { settings, fetchSettings, saveSettings, isLoading } = useSettings(apiPath);

    const isSystem = apiPath.includes('system');
    const isGlobal = apiPath.includes('global');

    useEffect(() => { fetchSettings(); }, [apiPath, fetchSettings]);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: any = {};

        if (isSystem) {
            data.web_port = parseInt(formData.get('web_port') as string);
        } else {
            data.model_id = formData.get('model_id');
            data.ai_endpoint = formData.get('ai_endpoint');
            data.colors = true;
        }

        const success = await saveSettings(data);
        if (success) {
            alert("Configuration updated.");
        }
    };

    const title = isSystem ? "System" : isGlobal ? "Global" : "Personal";
    const subtitle = isSystem ? "Low-level server configuration." : isGlobal ? "Default fallback settings for all users." : "Your personal agent environment.";

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">{title} Preferences</h2>
                    <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium">{subtitle}</p>
            </header>

            <Card className="p-8">
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
                                <Input label="Web Interface Port" name="web_port" type="number" defaultValue={settings?.web_port} />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Neural Model ID" name="model_id" defaultValue={settings?.model_id} placeholder="e.g. gpt-4o" icon="terminal" />
                                </div>
                                <Input label="Gateway Endpoint" name="ai_endpoint" defaultValue={settings?.ai_endpoint} placeholder="https://api..." icon="globe" />
                            </>
                        )}

                        <div className="pt-4 flex justify-between items-center border-t border-zinc-800/50">
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                {isSystem ? "Requires server restart" : "Changes take effect immediately"}
                            </p>
                            <Button type="submit" className="rounded-xl px-8" loading={isLoading}>Save Configuration</Button>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
}

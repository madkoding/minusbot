import React, { useState, useEffect } from "react";
import { Card, Input, Button } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function SettingsView({ apiPath = '/user/settings' }: { apiPath?: string }) {
    const [settings, setSettings] = useState<any>({});
    const isSystem = apiPath.includes('system');
    const isGlobal = apiPath.includes('global');
    const isUser = !isSystem && !isGlobal;

    const load = async () => {
        try {
            const res = await api.get(apiPath);
            setSettings(res.data);
        } catch (e) {
            console.error("Settings load failure", e);
        }
    };

    useEffect(() => { load(); }, [apiPath]);

    const update = async (e: any) => {
        e.preventDefault();
        const data: any = {};
        if (isSystem) {
            data.web_port = parseInt(e.target.web_port.value);
        } else {
            data.model_id = e.target.model_id?.value;
            data.ai_endpoint = e.target.ai_endpoint?.value;
            data.colors = true;
        }

        try {
            await api.put(apiPath, data);
            alert("Configuration updated.");
        } catch {
            alert("Update failed");
        }
    };

    const title = isSystem ? "System" : isGlobal ? "Global" : "Personal";
    const subtitle = isSystem ? "Low-level server configuration." : isGlobal ? "Default fallback settings for all users." : "Your personal agent environment.";

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <header>
                <h2 className="text-3xl font-black tracking-tight text-zinc-100">{title} Settings</h2>
                <p className="text-zinc-500 mt-1">{subtitle}</p>
            </header>

            <Card className="p-8">
                <form onSubmit={update} className="space-y-8">
                    {isSystem ? (
                        <div className="grid grid-cols-1 gap-6">
                            <Input label="Web Interface Port" name="web_port" type="number" defaultValue={settings.web_port} />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Neural Model ID" name="model_id" defaultValue={settings.model_id} placeholder="e.g. gpt-4o" />
                            </div>
                            <Input label="Gateway Endpoint" name="ai_endpoint" defaultValue={settings.ai_endpoint} placeholder="https://api..." />
                        </>
                    )}

                    <div className="pt-4 flex justify-between items-center border-t border-zinc-800/50">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                            {isSystem ? "Requires server restart" : "Changes take effect immediately"}
                        </p>
                        <Button className="rounded-xl px-8">Save Configuration</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

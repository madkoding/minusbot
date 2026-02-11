import React, { useState, useEffect } from "react";
import { Card, Icon } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function ToolsView({ apiPath = '/user/settings' }: { apiPath?: string }) {
    const [tools, setTools] = useState<any[]>([]);
    const [disabledTools, setDisabledTools] = useState<string[]>([]);

    const load = async () => {
        try {
            const [toolsRes, settingsRes] = await Promise.all([
                api.get('/admin/tools'), // Tool list remains global
                api.get(apiPath)
            ]);
            setTools(toolsRes.data);
            setDisabledTools(settingsRes.data.disabled_tools || []);
        } catch (e) {
            console.error("Failed to load tools", e);
        }
    };

    useEffect(() => { load(); }, [apiPath]);

    const toggleTool = async (name: string) => {
        try {
            // Determine the correct endpoint based on the apiPath
            const endpoint = apiPath.includes('admin')
                ? '/admin/tools/toggle' // We need to ensure this route exists or is handled
                : '/user/settings/toggle-tool';

            // For admin, we might need a different payload or endpoint logic
            // But based on user request "toggle global tools", let's assume admin toggles global disabled list

            if (apiPath.includes('admin')) {
                await api.post('/admin/settings/toggle-global-tool', { name });
            } else {
                await api.post('/user/settings/toggle-tool', { name });
            }

            // Reload to get updated state
            const res = await api.get(apiPath);
            setDisabledTools(res.data.disabled_tools || []);
        } catch (e) {
            alert("Failed to toggle tool");
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header>
                <h2 className="text-3xl font-black tracking-tight text-zinc-100">System Tools</h2>
                <p className="text-zinc-500 mt-1">Configure built-in capabilities available to the agent.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool: any) => {
                    const isDisabled = disabledTools.includes(tool.function.name);
                    return (
                        <Card
                            key={tool.function.name}
                            className={`transition-all ${isDisabled ? 'opacity-50 grayscale bg-zinc-950/20' : 'bg-zinc-900/40 border-zinc-800'}`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${isDisabled ? 'bg-zinc-700' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`}></div>
                                        <h3 className={`font-bold tracking-tight ${isDisabled ? 'text-zinc-500' : 'text-zinc-100'}`}>
                                            {tool.function.name}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed italic">
                                        {tool.function.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleTool(tool.function.name)}
                                    className={`p-3 rounded-xl transition-all ${isDisabled
                                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                        : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shadow-lg'
                                        }`}
                                >
                                    <Icon name={isDisabled ? 'plus' : 'trash'} size={18} />
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {tools.length === 0 && (
                <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
                    <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">No system tools registered</p>
                </div>
            )}
        </div>
    );
}

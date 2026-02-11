import React, { useState, useEffect } from "react";
import { Icon, Modal, Button } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function ToolsView({ apiPath = '/user/settings' }: { apiPath?: string }) {
    const [tools, setTools] = useState<any[]>([]);
    const [disabledTools, setDisabledTools] = useState<string[]>([]);
    const [activeGroup, setActiveGroup] = useState<string>("All");
    const [descModal, setDescModal] = useState<any>(null);

    const load = async () => {
        try {
            const [toolsRes, settingsRes] = await Promise.all([
                api.get('/admin/tools'),
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
            if (apiPath.includes('admin')) {
                await api.post('/admin/settings/toggle-global-tool', { name });
            } else {
                await api.post('/user/settings/toggle-tool', { name });
            }
            load();
        } catch (e) {
            alert("Failed to toggle tool");
        }
    };

    // Grouping logic
    const groups = ["All", ...new Set(tools.map(t => t.function.name.includes('_') ? t.function.name.split('_')[0] : "Others"))];
    const filteredTools = tools.filter(t => {
        if (activeGroup === "All") return true;
        const g = t.function.name.includes('_') ? t.function.name.split('_')[0] : "Others";
        return g === activeGroup;
    });

    return (
        <div className="space-y-10 max-w-5xl mx-auto h-full">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">System Tooling</h2>
                    <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Configure the core capability modules available to the AI agent.</p>
            </header>

            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-900/50">
                {groups.map(g => (
                    <button
                        key={g}
                        onClick={() => setActiveGroup(g)}
                        className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap pb-3 transition-all ${activeGroup === g ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                    >
                        {g}
                    </button>
                ))}
            </div>

            <div className="bg-[#080808] border border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-900/50 bg-zinc-900/10">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 w-1/4">Identifier</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 w-1/2">Purpose</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/30">
                        {filteredTools.map((tool: any) => {
                            const isDisabled = disabledTools.includes(tool.function.name);
                            return (
                                <tr key={tool.function.name} className="group hover:bg-zinc-900/20 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${!isDisabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`}></div>
                                            <span className={`text-sm font-bold ${!isDisabled ? 'text-zinc-200' : 'text-zinc-600'}`}>{tool.function.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p
                                            className="text-[11px] text-zinc-500 font-medium truncate max-w-md cursor-pointer hover:text-zinc-300 transition-colors"
                                            onClick={() => setDescModal(tool)}
                                        >
                                            {tool.function.description}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => toggleTool(tool.function.name)}
                                            className={`inline-block w-12 h-6 rounded-full transition-all relative p-1 ${isDisabled ? 'bg-zinc-800' : 'bg-emerald-500'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isDisabled ? 'translate-x-0' : 'translate-x-6'
                                                }`} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredTools.length === 0 && (
                    <div className="py-20 text-center text-zinc-800 italic uppercase text-[10px] font-black tracking-widest">
                        No modules found in this sector
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!descModal}
                onClose={() => setDescModal(null)}
                title={descModal?.function.name}
            >
                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                        {descModal?.function.description}
                    </p>
                    <div className="pt-4 border-t border-zinc-900 flex justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setDescModal(null)}>Dismiss</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}


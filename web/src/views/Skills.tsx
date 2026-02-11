import React, { useState, useEffect } from "react";
import { Card, Button, Icon } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function SkillsView({ apiPath = '/admin/skills' }: { apiPath?: string }) {
    const [skills, setSkills] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({ skillJson: {}, scriptPy: "" });

    const load = async () => {
        try {
            const res = await api.get(apiPath);
            setSkills(res.data);
        } catch (e) {
            console.error("Failed to load skills", e);
        }
    };

    const loadDetail = async (id: string) => {
        try {
            const res = await api.get(`${apiPath}/${id}`);
            const data = res.data;
            setSelected(data);
            setEditData({ skillJson: data.skillJson, scriptPy: data.scriptPy });
            setIsEditing(true);
        } catch (e) {
            console.error("Failed to load skill details", e);
        }
    };

    useEffect(() => { load(); }, [apiPath]);

    const save = async () => {
        const id = selected?.id || prompt("Skill ID (folder name):");
        if (!id) return;

        try {
            await api.post(apiPath, { id, ...editData });
            alert("Skill saved.");
            setIsEditing(false);
            setSelected(null);
            load();
        } catch (e) {
            alert("Save failed");
        }
    };

    const remove = async (id: string) => {
        if (!confirm("Delete skill modules?")) return;
        try {
            await api.delete(`${apiPath}/${id}`);
            load();
        } catch (e) {
            console.error("Failed to delete skill", e);
        }
    };

    const toggleStatus = async (skill: any) => {
        if (apiPath.includes('admin')) {
            // Admin toggling global skill enabled status
            try {
                await api.post(`/admin/skills/${skill.id}/toggle`);
                load();
            } catch {
                alert("Failed to toggle global skill");
            }
            return;
        }

        if (skill.isGlobal && apiPath.includes('/user')) {
            // User personal toggle for global skill
            try {
                await api.post('/user/settings/toggle-skill', { id: skill.id });
                load();
            } catch {
                alert("Failed to toggle personal override");
            }
            return;
        }

        const newStatus = !skill.enabled;
        const updatedJson = { ...skill.definition, enabled: newStatus };
        try {
            await api.post(apiPath, {
                id: skill.id,
                skillJson: updatedJson
            });
            load();
        } catch (e) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 max-w-7xl mx-auto h-[calc(100vh-12rem)]">
            <div className="md:col-span-4 flex flex-col space-y-6">
                <header className="flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-zinc-100">Skills</h2>
                        <p className="text-zinc-500 mt-1">{apiPath.includes('admin') ? 'Global' : 'Personal'} agent capabilities.</p>
                    </div>
                    {(!apiPath.includes('admin') || true) && (
                        <Button onClick={() => { setIsEditing(true); setSelected(null); setEditData({ skillJson: {}, scriptPy: "" }); }} variant="secondary" size="sm" className="rounded-xl">
                            <Icon name="plus" size={16} />
                        </Button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {skills.map(s => (
                        <div key={s.id} className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${s.enabled ? 'bg-zinc-900 border-zinc-800/30' : 'bg-zinc-950 border-zinc-900 opacity-60'
                            }`}>
                            <button onClick={() => s.isGlobal && !apiPath.includes('admin') ? null : loadDetail(s.id)} className={`flex-1 text-left ${s.isGlobal && !apiPath.includes('admin') ? 'cursor-default' : 'cursor-pointer'}`}>
                                <span className={`text-sm font-bold ${s.enabled ? 'text-zinc-200' : 'text-zinc-500'}`}>{s.id}</span>
                                {s.isGlobal && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded-md bg-zinc-800 text-[8px] font-black uppercase text-zinc-400">Global</span>
                                )}
                                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                                    {s.enabled ? 'Active' : 'Disabled'}
                                </div>
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleStatus(s)}
                                    className={`p-2 rounded-lg transition-colors ${s.enabled ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-800 hover:text-zinc-600'}`}
                                    title={s.enabled ? 'Deactivate' : 'Activate'}
                                >
                                    <Icon name={s.enabled ? 'dashboard' : 'plus'} size={14} />
                                </button>
                                {(!s.isGlobal || apiPath.includes('admin')) && (
                                    <button onClick={() => remove(s.id)} className="p-2 text-zinc-800 hover:text-red-500 transition-colors">
                                        <Icon name="trash" size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="md:col-span-8 h-full overflow-hidden">
                {isEditing ? (
                    <Card title={selected ? `Edit: ${selected.id}` : "Create Module"} className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-6">
                            <div>
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 block ml-1">skill.json</label>
                                <textarea
                                    className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs text-zinc-300 outline-none focus:border-zinc-600 transition-all resize-none"
                                    value={JSON.stringify(editData.skillJson, null, 4)}
                                    onChange={(e) => {
                                        try {
                                            const json = JSON.parse(e.target.value);
                                            setEditData({ ...editData, skillJson: json });
                                        } catch { }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 block ml-1">script.py</label>
                                <textarea
                                    className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs text-zinc-300 outline-none focus:border-zinc-600 transition-all resize-none"
                                    value={editData.scriptPy}
                                    onChange={(e) => setEditData({ ...editData, scriptPy: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800/50 flex-shrink-0">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={save} className="rounded-xl px-8">Save</Button>
                        </div>
                    </Card>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 p-10 text-center">
                        <Icon name="send" size={32} />
                        <h3 className="text-lg font-bold text-zinc-500 mt-4">Module Editor</h3>
                        <p className="max-w-[200px] text-xs mt-2 font-medium">Select a skill or create a new one to modify its intelligence logic.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

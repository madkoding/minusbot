import React, { useState, useEffect } from "react";
import { Button } from "../components/ui";
import { Icon } from "../components/icons";
import { Modal } from "../components/modals";
import { useSkills } from "../hooks/useSkills";

export default function SkillsView({ apiPath = '/user/skills' }: { apiPath?: string }) {
    const {
        skills,
        selectedSkill,
        skillVault,
        isLoading,
        fetchSkills,
        fetchSkillDetail,
        saveSkill,
        toggleSkillStatus,
        deleteSkill,
        updateSkillVault,
        setSelectedSkill
    } = useSkills(apiPath);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({ skillJson: {}, scriptPy: "" });
    const [editTab, setEditTab] = useState<'code' | 'vault'>('code');
    const [activeGroup, setActiveGroup] = useState<string>("All");
    const [descModal, setDescModal] = useState<any>(null);

    useEffect(() => { fetchSkills(); }, [apiPath, fetchSkills]);

    const handleLoadDetail = async (id: string) => {
        await fetchSkillDetail(id);
        setIsEditing(true);
        setEditTab('code');
    };

    useEffect(() => {
        if (selectedSkill) {
            setEditData({ skillJson: selectedSkill.skillJson, scriptPy: selectedSkill.scriptPy });
        }
    }, [selectedSkill]);

    const handleSave = async () => {
        const id = selectedSkill?.id || prompt("Skill ID (folder name):");
        if (!id) return;
        const success = await saveSkill(id, editData);
        if (success) {
            setIsEditing(false);
            setSelectedSkill(null);
        }
    };

    const handleToggleStatus = async (skill: any) => {
        await toggleSkillStatus(skill);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently delete this module?")) return;
        await deleteSkill(id);
    };

    // Grouping logic
    const groups = ["All", ...new Set(skills.map(s => s.id.includes('_') ? s.id.split('_')[0] : "Others"))];
    const filteredSkills = skills.filter(s => {
        if (activeGroup === "All") return true;
        const g = s.id.includes('_') ? s.id.split('_')[0] : "Others";
        return g === activeGroup;
    });

    if (isEditing) {
        return (
            <div className="max-w-5xl mx-auto h-full p-4 md:p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsEditing(false)} className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors">
                            <Icon name="logout" size={20} className="rotate-180" />
                        </button>
                        <h2 className="text-xl md:text-2xl font-bold text-zinc-100 truncate">{selectedSkill?.id || "Neural Manifest"}</h2>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSave} loading={isLoading}>Publish</Button>
                    </div>
                </div>

                <div className="flex gap-4 mb-8 border-b border-zinc-900">
                    <button onClick={() => setEditTab('code')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${editTab === 'code' ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-500'}`}>Source Code</button>
                    <button onClick={() => setEditTab('vault')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${editTab === 'vault' ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-500'}`}>Environments</button>
                </div>

                <div className="space-y-8">
                    {editTab === 'code' ? (
                        <>
                            <textarea
                                className="w-full h-40 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 font-mono text-xs text-zinc-400 outline-none focus:border-zinc-800 transition-all resize-none shadow-inner"
                                value={JSON.stringify(editData.skillJson, null, 4)}
                                onChange={(e) => {
                                    try {
                                        const json = JSON.parse(e.target.value);
                                        setEditData({ ...editData, skillJson: json });
                                    } catch { }
                                }}
                            />
                            <textarea
                                className="w-full h-96 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 font-mono text-xs text-zinc-400 outline-none focus:border-zinc-800 transition-all resize-none shadow-inner"
                                value={editData.scriptPy}
                                onChange={(e) => setEditData({ ...editData, scriptPy: e.target.value })}
                            />
                        </>
                    ) : (
                        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 divide-y divide-zinc-900">
                            {Object.entries(skillVault).map(([k, hasValue]: [string, any]) => (
                                <div key={k} className="py-6 first:pt-0 last:pb-0 flex items-center justify-between group">
                                    <div className="flex-1 mr-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-zinc-300 font-mono">{k}</span>
                                            <div className={`w-1 h-1 rounded-full ${hasValue ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                            {hasValue ? 'Environment configured' : 'Variable missing'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="rounded-xl h-9"
                                            onClick={async () => {
                                                const val = prompt(`Enter new value for ${k}:`);
                                                if (val) {
                                                    await updateSkillVault(selectedSkill.id, k, val);
                                                }
                                            }}
                                        >
                                            Overwrite
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-10 max-w-6xl mx-auto h-full p-4 md:p-0">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">Cognitive Skills</h2>
                        <div className="h-px flex-1 bg-zinc-900 ml-4 opacity-50"></div>
                    </div>
                    <p className="text-zinc-500 text-xs md:text-sm font-medium">Manage modular logic and automated behaviors.</p>
                </div>
                <div className="md:ml-10">
                    <Button onClick={() => { setIsEditing(true); setSelectedSkill(null); setEditData({ skillJson: {}, scriptPy: "" }); }} size="sm" className="rounded-xl w-full md:w-auto">
                        Deploy New Skill
                    </Button>
                </div>
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

            <div className="bg-[#080808] border border-zinc-900 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-zinc-900/50 bg-zinc-900/10">
                            <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 w-1/4">Identifier</th>
                            <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 w-1/2">Purpose</th>
                            <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/30">
                        {filteredSkills.map(s => (
                            <tr key={s.id} className="group hover:bg-zinc-900/20 transition-colors">
                                <td className="px-4 md:px-8 py-4 md:py-5">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className={`w-2 h-2 rounded-full ${s.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`}></div>
                                        <span className={`text-xs md:text-sm font-bold ${s.enabled ? 'text-zinc-200' : 'text-zinc-600'}`}>{s.id}</span>
                                        {s.isGlobal && (
                                            <span className="text-[8px] font-black uppercase bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800">System</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 md:px-8 py-4 md:py-5">
                                    <p
                                        className="text-[10px] md:text-[11px] text-zinc-500 font-medium truncate max-w-md cursor-pointer hover:text-zinc-300 transition-colors"
                                        onClick={() => setDescModal(s)}
                                    >
                                        {(s.definition || s.skillJson)?.description || "No description provided."}
                                    </p>
                                </td>
                                <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleToggleStatus(s)} className="p-2 text-zinc-600 hover:text-zinc-100" title={s.enabled ? "Deactivate" : "Activate"}>
                                            <Icon name={s.enabled ? "shield" : "plus"} size={16} />
                                        </button>
                                        {(!s.isGlobal || apiPath.includes('admin')) && (
                                            <>
                                                <button onClick={() => handleLoadDetail(s.id)} className="p-2 text-zinc-600 hover:text-zinc-100" title="Edit Logic">
                                                    <Icon name="terminal" size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(s.id)} className="p-2 text-zinc-600 hover:text-red-500" title="Delete">
                                                    <Icon name="trash" size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredSkills.length === 0 && (
                    <div className="py-20 text-center text-zinc-800 italic uppercase text-[10px] font-black tracking-widest">
                        Nothing found in this sector
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!descModal}
                onClose={() => setDescModal(null)}
                title={descModal?.id}
            >
                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                        {(descModal?.definition || descModal?.skillJson)?.description}
                    </p>
                    <div className="pt-4 border-t border-zinc-900 flex justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setDescModal(null)}>Dismiss</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

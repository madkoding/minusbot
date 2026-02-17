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
        fetchConfig,
        saveConfig,
        listDataFiles,
        getFileData,
        saveFileData,
        listScripts,
        getScriptContent,
        saveScriptContent,
        saveSkill,
        toggleSkillStatus,
        deleteSkill,
        updateSkillVault,
        setSelectedSkill
    } = useSkills(apiPath);

    const [isEditing, setIsEditing] = useState(false);
    const [editTab, setEditTab] = useState<'config' | 'data' | 'secrets' | 'definition' | 'source'>('config');
    const [activeGroup, setActiveGroup] = useState<string>("All");
    const [descModal, setDescModal] = useState<any>(null);

    // Editing State
    const [skillConfig, setSkillConfig] = useState<any>({});
    const [dataFiles, setDataFiles] = useState<string[]>([]);
    const [selectedDataFile, setSelectedDataFile] = useState<string | null>(null);
    const [dataFileContent, setDataFileContent] = useState<string>("");

    const [scriptFiles, setScriptFiles] = useState<string[]>([]);
    const [selectedScript, setSelectedScript] = useState<string | null>(null);
    const [scriptContent, setScriptContent] = useState<string>("");

    const [definitionJson, setDefinitionJson] = useState<string>("{}");

    useEffect(() => { fetchSkills(); }, [apiPath, fetchSkills]);

    const handleLoadDetail = async (id: string) => {
        const detail = await fetchSkillDetail(id);
        if (detail) {
            setDefinitionJson(JSON.stringify(detail.skillJson, null, 4));

            // Load Config
            const config = await fetchConfig(id);
            setSkillConfig(config);

            // Load Data Files
            const files = await listDataFiles(id);
            setDataFiles(files);
            if (files.length > 0) {
                setSelectedDataFile(files[0]);
                const content = await getFileData(id, files[0]);
                setDataFileContent(content);
            } else {
                setSelectedDataFile(null);
                setDataFileContent("");
            }

            // Load Scripts
            const scripts = await listScripts(id);
            setScriptFiles(scripts);
            if (scripts.length > 0) {
                setSelectedScript(scripts[0]);
                const content = await getScriptContent(id, scripts[0]);
                setScriptContent(content);
            } else {
                setSelectedScript(null);
                setScriptContent("");
            }

            setIsEditing(true);
            setEditTab('config');
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedSkill) return;
        await saveConfig(selectedSkill.id, skillConfig);
        alert("Configuration saved.");
    };

    const handleSaveData = async () => {
        if (!selectedSkill || !selectedDataFile) return;
        await saveFileData(selectedSkill.id, selectedDataFile, dataFileContent);
        alert("Data file saved.");
    };

    const handleSaveScript = async () => {
        if (!selectedSkill || !selectedScript) return;
        if (selectedSkill.isGlobal) return;
        await saveScriptContent(selectedSkill.id, selectedScript, scriptContent);
        alert("Script saved.");
    };

    const handleSaveDefinition = async () => {
        if (!selectedSkill) return;
        if (selectedSkill.isGlobal) return;
        try {
            const json = JSON.parse(definitionJson);
            await saveSkill(selectedSkill.id, { skillJson: json });
            alert("Definition saved.");
        } catch (e: any) {
            alert("Invalid JSON: " + e.message);
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
        const skill = selectedSkill;
        const isGlobal = skill?.isGlobal;
        const schema = skill?.skillJson?.configSchema || {};

        return (
            <div className="max-w-6xl mx-auto h-full p-4 md:p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsEditing(false)} className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors">
                            <Icon name="logout" size={20} className="rotate-180" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl md:text-2xl font-bold text-zinc-100 truncate">{skill?.id || "New Skill"}</h2>
                                {isGlobal && (
                                    <span className="text-[10px] font-black uppercase bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800 tracking-widest">Global</span>
                                )}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{skill?.skillJson?.displayName}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mb-8 border-b border-zinc-900 overflow-x-auto scrollbar-none">
                    <button onClick={() => setEditTab('config')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${editTab === 'config' ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-500'}`}>Settings</button>
                    <button onClick={() => setEditTab('data')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${editTab === 'data' ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-500'}`}>Data Storage</button>
                    <button onClick={() => setEditTab('secrets')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${editTab === 'secrets' ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-500'}`}>Environments</button>
                    <button onClick={() => setEditTab('definition')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${editTab === 'definition' ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-500'}`}>Definition</button>
                    <button onClick={() => setEditTab('source')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${editTab === 'source' ? 'text-zinc-100 border-b-2 border-zinc-100' : 'text-zinc-500'}`}>Source Code</button>
                </div>

                <div className="min-h-[500px]">
                    {editTab === 'config' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8">
                                <h3 className="text-zinc-100 text-sm font-bold uppercase tracking-widest mb-6 border-b border-zinc-900 pb-4">Personal Configuration</h3>
                                <div className="space-y-6">
                                    {(schema.properties) ? Object.entries(schema.properties).map(([key, prop]: [string, any]) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 block">{prop.title || key}</label>
                                            {prop.type === 'boolean' ? (
                                                <button
                                                    onClick={() => setSkillConfig({ ...skillConfig, [key]: !skillConfig[key] })}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${skillConfig[key] ? 'bg-zinc-100' : 'bg-zinc-900 border border-zinc-800'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${skillConfig[key] ? 'right-1 bg-zinc-950 shadow-sm' : 'left-1 bg-zinc-700'}`} />
                                                </button>
                                            ) : (
                                                <input
                                                    type={prop.type === 'number' ? 'number' : 'text'}
                                                    value={skillConfig[key] ?? ""}
                                                    placeholder={prop.description || prop.default}
                                                    onChange={(e) => setSkillConfig({ ...skillConfig, [key]: prop.type === 'number' ? Number(e.target.value) : e.target.value })}
                                                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-300 outline-none focus:border-zinc-700 transition-all font-medium"
                                                />
                                            )}
                                            {prop.description && <p className="text-[10px] text-zinc-600 font-medium italic ml-1">{prop.description}</p>}
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center text-zinc-700 text-xs italic font-medium">This skill has no configurable parameters.</div>
                                    )}
                                </div>
                                {schema.properties && (
                                    <div className="mt-10 pt-6 border-t border-zinc-900 flex justify-end">
                                        <Button onClick={handleSaveConfig} loading={isLoading} className="rounded-xl px-8">Save Settings</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {editTab === 'data' && (
                        <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-[600px]">
                            <div className="w-full md:w-64 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Files</h3>
                                    <button onClick={async () => {
                                        const name = prompt("Filename (e.g. data.json):");
                                        if (name && !dataFiles.includes(name)) {
                                            await saveFileData(skill!.id, name, "{}");
                                            setDataFiles([...dataFiles, name]);
                                            setSelectedDataFile(name);
                                            setDataFileContent("{}");
                                        }
                                    }} className="text-zinc-600 hover:text-zinc-100">
                                        <Icon name="plus" size={14} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {dataFiles.map(file => (
                                        <button
                                            key={file}
                                            onClick={async () => {
                                                setSelectedDataFile(file);
                                                const content = await getFileData(skill!.id, file);
                                                setDataFileContent(content);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all truncate ${selectedDataFile === file ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-900/50'}`}
                                        >
                                            {file}
                                        </button>
                                    ))}
                                    {dataFiles.length === 0 && <div className="text-zinc-800 text-[10px] italic py-4 px-2">No files yet.</div>}
                                </div>
                            </div>
                            <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-3xl flex flex-col overflow-hidden">
                                {selectedDataFile ? (
                                    <>
                                        <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">{selectedDataFile}</span>
                                            <Button onClick={handleSaveData} size="sm" className="rounded-lg h-7 px-3 text-[9px] font-black uppercase tracking-widest">Save</Button>
                                        </div>
                                        <textarea
                                            value={dataFileContent}
                                            onChange={(e) => setDataFileContent(e.target.value)}
                                            className="flex-1 w-full p-6 bg-transparent text-zinc-400 font-mono text-xs outline-none resize-none custom-scrollbar"
                                            placeholder="Enter dynamic data content..."
                                        />
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="p-4 rounded-full bg-zinc-900/50 mb-4">
                                            <Icon name="settings" size={32} className="text-zinc-800" />
                                        </div>
                                        <p className="text-zinc-600 text-xs italic">Select a file from the list or create a new one to manage skill data.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {editTab === 'secrets' && (
                        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 divide-y divide-zinc-900 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-zinc-100 text-sm font-bold uppercase tracking-widest mb-6 border-b border-zinc-900 pb-4 flex items-center gap-2">
                                <Icon name="shield" size={16} />
                                Secrets Vault
                            </h3>
                            {Object.entries(skillVault).length > 0 ? Object.entries(skillVault).map(([k, hasValue]: [string, any]) => (
                                <div key={k} className="py-6 flex items-center justify-between group">
                                    <div className="flex-1 mr-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-zinc-300 font-mono">{k}</span>
                                            <div className={`w-1 h-1 rounded-full ${hasValue ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'}`}></div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                            {hasValue ? 'Variable encrypted' : 'MISSING REQUIRED CREDENTIAL'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="rounded-xl h-9 px-4 text-[9px] font-black uppercase tracking-widest border border-zinc-800"
                                            onClick={async () => {
                                                const val = prompt(`Enter new value for ${k}:`);
                                                if (val) {
                                                    await updateSkillVault(selectedSkill!.id, k, val);
                                                }
                                            }}
                                        >
                                            {hasValue ? 'Overwrite' : 'Set Key'}
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-zinc-800 italic uppercase text-[10px] font-black tracking-widest">No keys required for this skill.</div>
                            )}
                        </div>
                    )}

                    {editTab === 'definition' && (
                        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl flex flex-col overflow-hidden h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">skill.json</span>
                                    {isGlobal && <span className="text-[8px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">READONLY</span>}
                                </div>
                                {!isGlobal && <Button onClick={handleSaveDefinition} size="sm" className="rounded-lg h-7 px-3 text-[9px] font-black uppercase tracking-widest">Save</Button>}
                            </div>
                            <textarea
                                value={definitionJson}
                                readOnly={isGlobal}
                                onChange={(e) => setDefinitionJson(e.target.value)}
                                className={`flex-1 w-full p-8 bg-transparent text-zinc-500 font-mono text-xs outline-none resize-none custom-scrollbar ${isGlobal ? 'opacity-50' : ''}`}
                                placeholder="Skill definition JSON..."
                            />
                        </div>
                    )}

                    {editTab === 'source' && (
                        <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-[600px]">
                            <div className="w-full md:w-64 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Scripts</h3>
                                    {!isGlobal && <button onClick={async () => {
                                        const name = prompt("Filename (e.g. main.py):");
                                        if (name && !scriptFiles.includes(name)) {
                                            await saveScriptContent(selectedSkill!.id, name, "");
                                            setScriptFiles([...scriptFiles, name]);
                                            setSelectedScript(name);
                                            setScriptContent("");
                                        }
                                    }} className="text-zinc-600 hover:text-zinc-100">
                                        <Icon name="plus" size={14} />
                                    </button>}
                                </div>
                                <div className="space-y-1">
                                    {scriptFiles.map(file => (
                                        <button
                                            key={file}
                                            onClick={async () => {
                                                setSelectedScript(file);
                                                const content = await getScriptContent(skill!.id, file);
                                                setScriptContent(content);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all truncate ${selectedScript === file ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-900/50'}`}
                                        >
                                            {file}
                                        </button>
                                    ))}
                                    {scriptFiles.length === 0 && <div className="text-zinc-800 text-[10px] italic py-4 px-2">No scripts found.</div>}
                                </div>
                            </div>
                            <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-3xl flex flex-col overflow-hidden">
                                {selectedScript ? (
                                    <>
                                        <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">{selectedScript}</span>
                                                {isGlobal && <span className="text-[8px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">READONLY</span>}
                                            </div>
                                            {!isGlobal && <Button onClick={handleSaveScript} size="sm" className="rounded-lg h-7 px-3 text-[9px] font-black uppercase tracking-widest">Save</Button>}
                                        </div>
                                        <textarea
                                            value={scriptContent}
                                            readOnly={isGlobal}
                                            onChange={(e) => setScriptContent(e.target.value)}
                                            className={`flex-1 w-full p-8 bg-transparent text-zinc-400 font-mono text-xs outline-none resize-none custom-scrollbar ${isGlobal ? 'opacity-50' : ''}`}
                                            placeholder="Code goes here..."
                                        />
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="p-4 rounded-full bg-zinc-900/50 mb-4">
                                            <Icon name="code" size={32} className="text-zinc-800" />
                                        </div>
                                        <p className="text-zinc-600 text-xs italic">Select a script to view its logic.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">Skills</h2>
                        <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium max-w-lg">Manage custom logic and skills to expand your assistant's capabilities.</p>
                </div>
                <div className="md:ml-10">
                    <Button onClick={() => { setIsEditing(true); setSelectedSkill(null); }} size="sm" className="rounded-xl w-full md:w-auto h-11 px-6 shadow-xl">
                        Create New Skill
                    </Button>
                </div>
            </header>

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none border-b border-zinc-900/50">
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
                            <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 w-1/4">Name</th>
                            <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 w-1/2">Description</th>
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
                                        <button onClick={() => handleLoadDetail(s.id)} className="p-2 text-zinc-600 hover:text-zinc-100" title="Manage Skill">
                                            <Icon name="terminal" size={16} />
                                        </button>
                                        {(!s.isGlobal || apiPath.includes('admin')) && (
                                            <button onClick={() => handleDelete(s.id)} className="p-2 text-zinc-600 hover:text-red-500" title="Delete">
                                                <Icon name="trash" size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredSkills.length === 0 && (
                    <div className="py-20 text-center text-zinc-800 italic uppercase text-[10px] font-black tracking-widest">
                        No skills found
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

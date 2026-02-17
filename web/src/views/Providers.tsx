import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button, Input } from "../components/ui";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { Modal } from "../components/modals";
import { useProviders } from "../hooks/useProviders";
import { useSettings } from "../hooks/useSettings";
import { useAuthStore } from "../stores/useAuthStore";

interface ProvidersViewProps {
    mode?: "personal" | "admin";
}

export default function ProvidersView({ mode = "personal" }: ProvidersViewProps) {
    const { user } = useAuthStore();
    const isRoot = user?.role === "root";
    const isAdminMode = mode === "admin";

    const {
        providers,
        clients,
        isLoading: isSystemLoading,
        saveProvider,
        deleteProvider,
        activateProvider,
        listModels,
        listModelsByConfig
    } = useProviders();

    // We fetch user settings to see personal active providers
    const { settings: userSettings, fetchSettings: fetchUserSettings } = useSettings("/user/settings");

    useEffect(() => {
        fetchUserSettings();
    }, [fetchUserSettings]);

    const [isAdding, setIsAdding] = useState(false);
    const [editingProvider, setEditingProvider] = useState<any>(null);
    const [isFetchingModels, setIsFetchingModels] = useState(false);

    const [form, setForm] = useState<any>({
        name: "",
        type: "text",
        client: "openai",
        config: { model_id: "", max_tokens: 4096, temperature: 0.7, extra: {} },
        token: "",
        is_global: isAdminMode
    });

    // Forced global/personal based on mode
    useEffect(() => {
        setForm((f: any) => ({ ...f, is_global: isAdminMode }));
    }, [isAdminMode, isAdding]);

    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedClient = useMemo(() => clients.find(c => c.id === form.client), [clients, form.client]);

    useEffect(() => {
        if (editingProvider) {
            setForm({
                id: editingProvider.id,
                name: editingProvider.name,
                type: editingProvider.type,
                client: editingProvider.client,
                config: { ...editingProvider.config },
                token: "",
                is_global: editingProvider.is_global
            });
            setIsAdding(true);
        }
    }, [editingProvider]);

    const fetchModels = async () => {
        if (!isAdding) return;
        if (!form.client || !form.type) return;

        const hasExtraRequired = selectedClient?.options?.every((opt: any) =>
            !opt.required || (form.config.extra && form.config.extra[opt.id])
        ) ?? true;

        if (!hasExtraRequired) return;
        if (!form.token && !editingProvider) return;

        setIsFetchingModels(true);
        try {
            let models = [];
            if (editingProvider && !form.token) {
                models = await listModels(editingProvider.id);
            } else {
                models = await listModelsByConfig({
                    client: form.client,
                    type: form.type,
                    apiKey: form.token,
                    extra: form.config.extra
                });
            }
            setAvailableModels(models || []);
        } catch (e) {
            console.error("Failed to fetch models", e);
            setAvailableModels([]);
        } finally {
            setIsFetchingModels(false);
        }
    };

    useEffect(() => {
        if (isAdding) {
            const timer = setTimeout(fetchModels, 800);
            return () => clearTimeout(timer);
        }
    }, [form.token, form.config.extra, form.client, form.type, isAdding]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveProvider(form);
        resetForm();
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingProvider(null);
        setAvailableModels([]);
        setSearchTerm("");
        setForm({
            name: "",
            type: "text",
            client: "openai",
            config: { model_id: "", max_tokens: 4096, temperature: 0.7, extra: {} },
            token: "",
            is_global: isAdminMode
        });
    };

    const filteredModels = useMemo(() => {
        return availableModels.filter(m =>
            m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [availableModels, searchTerm]);

    const filteredProviders = useMemo(() => {
        if (isAdminMode) {
            return providers.filter(p => p.is_global);
        }
        return providers;
    }, [providers, isAdminMode]);

    const types = [
        { id: "text", name: "Text", icon: "message-square" },
        { id: "vision", name: "Vision", icon: "eye" },
        { id: "image", name: "Image", icon: "image" },
        { id: "tts", name: "TTS", icon: "volume-2" },
        { id: "stt", name: "STT", icon: "mic" }
    ];

    const handleModelSelect = (modelId: string) => {
        setForm({ ...form, config: { ...form.config, model_id: modelId } });
        setIsModelModalOpen(false);
        setIsDropdownOpen(false);
        setSearchTerm("");
    };

    if (isSystemLoading || !userSettings) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in duration-500">
                <div className="w-12 h-12 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Loading Configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">
                        {isAdminMode ? "Global AI Providers" : "AI Providers"}
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium max-w-lg">
                        {isAdminMode
                            ? "Manage shared AI backends available to all users."
                            : "Manage your AI backends and active clients for different tasks."}
                    </p>
                </div>

                {!isAdding && (isAdminMode && (isRoot || user?.role === 'admin')) && (
                    <Button onClick={() => setIsAdding(true)} className="rounded-xl px-6 py-2 h-auto text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5 hover:bg-white/10 text-white transition-all duration-300">
                        <Icon name="plus" className="w-4 h-4 mr-2" />
                        Add Global Provider
                    </Button>
                )}

                {!isAdding && !isAdminMode && (
                    <Button onClick={() => setIsAdding(true)} className="rounded-xl px-6 py-2 h-auto text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5 hover:bg-white/10 text-white transition-all duration-300">
                        <Icon name="plus" className="w-4 h-4 mr-2" />
                        Add Personal Provider
                    </Button>
                )}
            </div>

            {isAdding ? (
                <Card className="p-8 border-white/5 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden group">
                    <form onSubmit={handleSave} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Provider Name</label>
                                <Input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. My OpenAI, Secondary OpenRouter..."
                                    className="bg-black/40 border-white/5 rounded-xl h-12"
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Provider Type</label>
                                <select
                                    disabled={!!editingProvider}
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                    className={`w-full bg-black/40 border border-white/5 rounded-xl h-12 px-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-white/10 ${!!editingProvider ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Client Protocol</label>
                                <select
                                    disabled={!!editingProvider}
                                    value={form.client}
                                    onChange={e => setForm({ ...form, client: e.target.value, config: { ...form.config, extra: {} } })}
                                    className={`w-full bg-black/40 border border-white/5 rounded-xl h-12 px-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-white/10 ${!!editingProvider ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">API Key / Token</label>
                                <Input
                                    type="password"
                                    value={form.token}
                                    onChange={e => setForm({ ...form, token: e.target.value })}
                                    placeholder={editingProvider ? "•••••••••••••••• (Encrypted)" : "sk-..."}
                                    className="bg-black/40 border-white/5 rounded-xl h-12"
                                    required={!editingProvider}
                                />
                            </div>

                            {/* Dynamic Options */}
                            {selectedClient?.options?.map((opt: any) => (
                                <div key={opt.id} className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{opt.label}</label>
                                    <Input
                                        disabled={!!editingProvider}
                                        type={opt.type === "password" ? "password" : "text"}
                                        value={form.config.extra?.[opt.id] ?? opt.default ?? ""}
                                        onChange={e => setForm({
                                            ...form,
                                            config: {
                                                ...form.config,
                                                extra: { ...form.config.extra, [opt.id]: e.target.value }
                                            }
                                        })}
                                        placeholder={opt.placeholder}
                                        className={`bg-black/40 border-white/5 rounded-xl h-12 ${!!editingProvider ? 'opacity-50' : ''}`}
                                        required={opt.required}
                                    />
                                    {opt.description && <p className="text-[9px] text-zinc-600 mt-1">{opt.description}</p>}
                                </div>
                            ))}

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Model ID</label>
                                    {isFetchingModels && <div className="flex items-center gap-1.5"><div className="w-2 h-2 border border-zinc-500 border-t-transparent rounded-full animate-spin"></div><span className="text-[8px] text-zinc-600 uppercase font-black">Fetching...</span></div>}
                                </div>

                                {availableModels.length > 0 ? (
                                    availableModels.length <= 25 ? (
                                        <div className="relative" ref={dropdownRef}>
                                            <div
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl h-12 px-4 flex items-center justify-between text-sm text-zinc-300 cursor-pointer hover:border-white/10 transition-colors"
                                            >
                                                <span className={form.config.model_id ? "text-zinc-100 font-bold" : "text-zinc-600"}>
                                                    {form.config.model_id || "Select model..."}
                                                </span>
                                                <Icon name="plus" size={14} className={`text-zinc-600 transition-transform ${isDropdownOpen ? 'rotate-0' : 'rotate-45'}`} />
                                            </div>

                                            {isDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-2 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in animate-fade-up">
                                                    <div className="p-3 border-b border-zinc-900 bg-white/5">
                                                        <Input
                                                            autoFocus
                                                            value={searchTerm}
                                                            onChange={e => setSearchTerm(e.target.value)}
                                                            placeholder="Search..."
                                                            className="h-9 text-xs bg-black/40 border-white/5 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                        {filteredModels.length > 0 ? filteredModels.map(m => (
                                                            <div
                                                                key={m.id}
                                                                onClick={() => handleModelSelect(m.id)}
                                                                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${form.config.model_id === m.id ? 'bg-zinc-100 text-black font-bold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                                            >
                                                                <div className="truncate">{m.id}</div>
                                                            </div>
                                                        )) : (
                                                            <div className="p-4 text-center text-[10px] uppercase font-black text-zinc-600">No models found</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setIsModelModalOpen(true)}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl h-12 px-4 flex items-center justify-between text-sm text-zinc-300 cursor-pointer hover:border-white/10 transition-colors"
                                        >
                                            <span className={form.config.model_id ? "text-zinc-100 font-bold" : "text-zinc-600"}>
                                                {form.config.model_id || "Select model from list..."}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">{availableModels.length} models</span>
                                                <Icon name="edit-2" size={12} className="text-zinc-600" />
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <Input
                                        value={form.config.model_id}
                                        onChange={e => setForm({ ...form, config: { ...form.config, model_id: e.target.value } })}
                                        placeholder="e.g. gpt-4o, claude-3-5-sonnet..."
                                        className="bg-black/40 border-white/5 rounded-xl h-12"
                                        required
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Max Tokens</label>
                                    <Input
                                        type="number"
                                        value={form.config.max_tokens}
                                        onChange={e => setForm({ ...form, config: { ...form.config, max_tokens: Number(e.target.value) } })}
                                        className="bg-black/40 border-white/5 rounded-xl h-12"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Temperature</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={form.config.temperature}
                                        onChange={e => setForm({ ...form, config: { ...form.config, temperature: Number(e.target.value) } })}
                                        className="bg-black/40 border-white/5 rounded-xl h-12"
                                    />
                                </div>
                            </div>
                        </div>

                        {isRoot && !isAdminMode && (
                            <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <input
                                    type="checkbox"
                                    id="is_global"
                                    checked={form.is_global}
                                    onChange={e => setForm({ ...form, is_global: e.target.checked })}
                                    className="w-4 h-4 accent-amber-500"
                                />
                                <div className="space-y-0.5">
                                    <label htmlFor="is_global" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 cursor-pointer">Global Provider</label>
                                    <p className="text-[8px] text-zinc-600 font-medium">Available to all users. Only root/admin can manage this.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            <Button type="submit" className="rounded-xl px-8 h-12 bg-zinc-100 text-black font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                                {editingProvider ? "Update Provider" : (isAdminMode ? "Create Global Provider" : "Register Provider")}
                            </Button>
                            <Button type="button" onClick={resetForm} className="rounded-xl px-8 h-12 border-white/5 bg-white/5 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProviders.map(provider => {
                        const type = types.find(t => t.id === provider.type);
                        const isActive = userSettings?.active_providers?.[provider.type] === provider.id;

                        // User can only edit their own providers, or global if they are admin/root and in admin mode
                        const canEdit = isAdminMode ? (isRoot || user?.role === 'admin') : (!provider.is_global && (isRoot || user?.role === 'admin' || true));
                        // Actually, in personal mode, if it's global, it's read-only.
                        const isReadOnly = !isAdminMode && provider.is_global;

                        return (
                            <Card key={provider.id} className="p-6 border-white/5 bg-zinc-900/30 backdrop-blur-xl group hover:border-white/10 transition-all duration-500 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                            <Icon name={type?.icon || "cpu"} className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isReadOnly && canEdit && (
                                                <>
                                                    <button onClick={() => setEditingProvider(provider)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
                                                        <Icon name="edit-2" className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deleteProvider(provider.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors">
                                                        <Icon name="trash-2" className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {isReadOnly && (
                                                <div className="p-2 text-[8px] font-black uppercase tracking-widest text-zinc-600 border border-zinc-800 rounded-lg">Read Only</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-6">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-zinc-100">{provider.name}</h3>
                                            {provider.is_global && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500/80 px-1.5 py-0.5 rounded border border-amber-500/10">Global</span>}
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-600">
                                            {provider.client} / {provider.config.model_id}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`}></div>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    {!isActive && (
                                        <Button
                                            onClick={async () => {
                                                await activateProvider(provider.id, provider.type, isAdminMode);
                                                fetchUserSettings();
                                            }}
                                            className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 border-white/5 hover:bg-zinc-100 hover:text-black transition-all"
                                        >
                                            Activate
                                        </Button>
                                    )}
                                    {isActive && (
                                        <Button
                                            onClick={async () => {
                                                await activateProvider(null, provider.type, isAdminMode);
                                                fetchUserSettings();
                                            }}
                                            className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500/10 border-red-500/10 text-red-400 hover:bg-red-500/20"
                                        >
                                            Deactivate
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}


                    {filteredProviders.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl group hover:border-white/10 transition-colors">
                            <div className="mb-4 inline-flex p-4 rounded-full bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                <Icon name="cpu" className="w-8 h-8 text-zinc-700" />
                            </div>
                            <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No providers configured</h3>
                            {(isAdminMode && (isRoot || user?.role === 'admin')) && (
                                <button onClick={() => setIsAdding(true)} className="mt-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors underline underline-offset-4 decoration-zinc-800 hover:decoration-white">
                                    Add your first global AI client
                                </button>
                            )}
                            {!isAdminMode && (
                                <button onClick={() => setIsAdding(true)} className="mt-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors underline underline-offset-4 decoration-zinc-800 hover:decoration-white">
                                    Add your first personal AI client
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Model Selection Modal */}
            <Modal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                title="Select Model"
                className="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            autoFocus
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search models..."
                            className="pl-11 bg-black/40 border-white/5 h-12 rounded-xl"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Icon name="message-square" size={18} />
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        <div className="grid grid-cols-1 gap-2">
                            {filteredModels.length > 0 ? filteredModels.map(model => (
                                <div
                                    key={model.id}
                                    onClick={() => handleModelSelect(model.id)}
                                    className={`p-4 rounded-xl border border-white/5 cursor-pointer flex items-center justify-between transition-all ${form.config.model_id === model.id ? 'bg-zinc-100 text-black border-zinc-100' : 'hover:bg-white/5 text-zinc-300'
                                        }`}
                                >
                                    <div className="min-w-0">
                                        <div className="font-bold truncate">{model.name || model.id}</div>
                                        <div className={`text-[10px] font-mono truncate uppercase tracking-tighter ${form.config.model_id === model.id ? 'text-black/60' : 'text-zinc-600'}`}>
                                            ID: {model.id}
                                        </div>
                                    </div>
                                    {form.config.model_id === model.id && <Icon name="check" size={16} />}
                                </div>
                            )) : (
                                <div className="py-12 text-center text-zinc-600 italic uppercase text-[10px] font-black tracking-widest">
                                    No models matching search
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                            Showing {filteredModels.length} of {availableModels.length} models
                        </span>
                        <Button variant="secondary" onClick={() => setIsModelModalOpen(false)} className="h-10 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

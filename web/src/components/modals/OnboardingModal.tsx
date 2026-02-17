import React, { useState, useEffect, useMemo } from "react";
import { FancyModal } from "./FancyModal";
import { Button, Input } from "../ui";
import { Icon } from "../icons";
import { useProviders } from "../../hooks/useProviders";
import { channelsService } from "../../services/channelsService";
import { useSettings } from "../../hooks/useSettings";
import { type ChannelStatus } from "../../types";

type OnboardingStep =
    | "ai-provider"
    | "ai-credentials"
    | "ai-model"
    | "ai-config"
    | "ai-scope"
    | "channel-select"
    | "channel-config"
    | "welcome";

export const OnboardingModal = () => {
    const { providers, clients, fetchProviders, saveProvider, activateProvider, listModelsByConfig, isLoading: isProvidersLoading } = useProviders();
    const { fetchSettings: fetchUserSettings } = useSettings();

    const [shouldShow, setShouldShow] = useState(false);
    const [step, setStep] = useState<OnboardingStep>("ai-provider");
    const [hasChecked, setHasChecked] = useState(false);

    // AI Config State
    const [providerType, setProviderType] = useState("openai");
    const [apiKey, setApiKey] = useState("");
    const [providerConfig, setProviderConfig] = useState<Record<string, any>>({});
    const [model, setModel] = useState("");
    const [maxTokens, setMaxTokens] = useState("4096");
    const [temperature, setTemperature] = useState("0.7");
    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // Channel Config State
    const [availableChannels, setAvailableChannels] = useState<ChannelStatus[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");
    const [channelConfig, setChannelConfig] = useState<Record<string, any>>({});

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial check
    useEffect(() => {
        const checkStatus = async () => {
            setIsLoading(true);
            try {
                // Fetch providers first if not loaded
                await fetchProviders();

                // Check channels - must explicitly check configured status
                const channels = await channelsService.list();
                setAvailableChannels(channels || []);

                const hasConfiguredChannels = Array.isArray(channels) && (channels as ChannelStatus[]).some((c) => c.configured);
                const hasProviders = providers.length > 0;

                // Show ONLY if NO providers AND NO configured channels
                if (hasProviders || hasConfiguredChannels) {
                    setShouldShow(false);
                } else {
                    setShouldShow(true);
                }
            } catch (e) {
                console.error("Failed to list channels/providers", e);
                setShouldShow(false); // Hide on error to avoid blocking UI
            } finally {
                setHasChecked(true);
                setIsLoading(false);
            }
        };

        if (!hasChecked) {
            checkStatus();
        }
    }, [hasChecked, fetchProviders, providers.length]);

    const selectedClient = useMemo(() => clients.find(c => c.id === providerType), [clients, providerType]);
    const selectedChannel = useMemo(() => availableChannels.find(c => c.id === selectedChannelId), [availableChannels, selectedChannelId]);

    const fetchModels = async () => {
        setLoadingModels(true);
        try {
            const models = await listModelsByConfig({
                client: providerType,
                type: "text",
                apiKey: apiKey,
                extra: providerConfig
            });
            setAvailableModels(models || []);
            if (models && models.length > 0) {
                setModel(models[0].id);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to fetch models. Check your credentials.");
        } finally {
            setLoadingModels(false);
        }
    };

    // Auto-fetch models when entering model step
    useEffect(() => {
        if (step === "ai-model" && availableModels.length === 0) {
            fetchModels();
        }
    }, [step]);

    const handleSaveAI = async (isGlobal: boolean) => {
        setIsLoading(true);
        try {
            const newProvider = await saveProvider({
                name: "Primary AI (Onboarding)",
                type: "text",
                client: providerType,
                token: apiKey,
                config: {
                    model_id: model,
                    max_tokens: parseInt(maxTokens),
                    temperature: parseFloat(temperature),
                    extra: providerConfig
                },
                is_global: isGlobal
            });

            // Activate the provider immediately
            if (newProvider && newProvider.id) {
                await activateProvider(newProvider.id, "text", isGlobal);
            }

            // Refresh settings to reflect active provider
            await fetchUserSettings();
            setStep("channel-select");
        } catch (e) {
            setError("Failed to save AI provider");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveChannel = async () => {
        if (!selectedChannel) return;

        setIsLoading(true);
        try {
            const settings: Record<string, any> = {};
            const secrets: Record<string, any> = {};

            selectedChannel.fields.forEach((field: any) => {
                const value = channelConfig[field.id];
                if (value !== undefined) {
                    if (field.secret) {
                        secrets[field.id] = value;
                    } else {
                        settings[field.id] = value;
                    }
                }
            });

            await channelsService.save(selectedChannelId, {
                enabled: true,
                settings,
                secrets
            });

            setStep("welcome");
        } catch (e) {
            setError("Failed to save channel");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to clear error when changing steps
    const changeStep = (newStep: OnboardingStep) => {
        setError(null);
        setStep(newStep);
    };

    if ((!shouldShow && hasChecked) || (!hasChecked && isProvidersLoading)) return null;

    // --- Render Steps ---

    const renderAIProvider = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 animate-fade-in">
                    <Icon name="Cpu" size={32} className="text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold">Choose AI Provider</h2>
                <p className="text-zinc-400">Select the AI service you want to use.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {clients.map(client => (
                    <button
                        key={client.id}
                        onClick={() => {
                            setProviderType(client.id);
                            // Reset state
                            setApiKey("");
                            setModel("");
                            setProviderConfig({});
                            setAvailableModels([]);
                            changeStep("ai-credentials");
                        }}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center justify-between group"
                    >
                        <span className="font-bold text-zinc-200 capitalize group-hover:text-white">{client.name}</span>
                        <Icon name="ChevronRight" size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                    </button>
                ))}
            </div>

            <button onClick={() => changeStep("channel-select")} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 font-medium uppercase tracking-widest pt-4">
                Skip AI Setup
            </button>
        </div>
    );

    const renderAICredentials = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 animate-fade-in">
                    <Icon name="Key" size={32} className="text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold">Configure Credentials</h2>
                <p className="text-zinc-400">Enter your API key and settings for {selectedClient?.name}.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">API Token</label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={selectedClient?.id === "ollama" ? "Not required" : "sk-..."}
                        autoFocus
                    />
                </div>

                {selectedClient?.options?.map((opt: any) => (
                    <div key={opt.id} className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{opt.label}</label>
                        <Input
                            value={providerConfig[opt.id] || ""}
                            onChange={e => setProviderConfig({ ...providerConfig, [opt.id]: e.target.value })}
                            placeholder={opt.placeholder}
                            type={opt.type === "password" ? "password" : "text"}
                        />
                        {opt.description && <p className="text-[10px] text-zinc-500">{opt.description}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="secondary" onClick={() => changeStep("ai-provider")} className="h-12">Back</Button>
                <Button
                    variant="primary"
                    onClick={() => changeStep("ai-model")}
                    className="h-12"
                    disabled={!apiKey && selectedClient?.id !== 'ollama'}
                >
                    Next Step
                </Button>
            </div>
        </div>
    );

    const renderAIModel = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 animate-fade-in">
                    <Icon name="Box" size={32} className="text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold">Select Model</h2>
                <p className="text-zinc-400">Choose which model you want to use.</p>
            </div>

            <div className="space-y-4">
                {loadingModels ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3 text-zinc-500">
                        <Icon name="Loader2" size={24} className="animate-spin text-pink-500" />
                        <span className="text-xs uppercase tracking-widest font-medium">Fetching models...</span>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3 w-full bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                            onClick={fetchModels}
                        >
                            Retry
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {availableModels.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setModel(m.id)}
                                className={`w-full p-3 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${model === m.id
                                    ? "bg-pink-500/10 border-pink-500/50 text-pink-400"
                                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                    }`}
                            >
                                <span className="font-medium truncate">{m.id}</span>
                                {model === m.id && <Icon name="Check" size={16} />}
                            </button>
                        ))}
                        {availableModels.length === 0 && (
                            <div className="text-center py-8 text-zinc-500">No models found.</div>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Or enter custom model ID</label>
                    <Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. gpt-4" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="secondary" onClick={() => changeStep("ai-credentials")} className="h-12">Back</Button>
                <Button
                    variant="primary"
                    onClick={() => changeStep("ai-config")}
                    className="h-12"
                    disabled={!model}
                >
                    Next Step
                </Button>
            </div>
        </div>
    );

    const renderAIConfig = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 animate-fade-in">
                    <Icon name="Sliders" size={32} className="text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold">Fine-tune Settings</h2>
                <p className="text-zinc-400">Adjust the behavior of the model.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Max Tokens</label>
                    <Input
                        type="number"
                        value={maxTokens}
                        onChange={e => setMaxTokens(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-500">Maximum length of generated responses.</p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Temperature ({temperature})</label>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={e => setTemperature(e.target.value)}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <p className="text-[10px] text-zinc-500">Controls randomness: Lower is more deterministic, higher is more creative.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="secondary" onClick={() => changeStep("ai-model")} className="h-12">Back</Button>
                <Button variant="primary" onClick={() => changeStep("ai-scope")} className="h-12">Next Step</Button>
            </div>
        </div>
    );

    const renderAIScope = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 animate-fade-in">
                    <Icon name="Save" size={32} className="text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold">Save Configuration</h2>
                <p className="text-zinc-400">Who should have access to this provider?</p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => handleSaveAI(false)}
                    className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group"
                    disabled={isLoading}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200">
                            <Icon name="User" size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-200 group-hover:text-white">Save for Me (Private)</h4>
                            <p className="text-xs text-zinc-500">Only you can use this provider (Root).</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => handleSaveAI(true)}
                    className="w-full p-4 rounded-xl border border-pink-900/30 bg-pink-900/5 hover:bg-pink-900/10 hover:border-pink-500/30 transition-all text-left group"
                    disabled={isLoading}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 group-hover:bg-pink-500/20">
                            <Icon name="Globe" size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-pink-200 group-hover:text-white">Save for All Users (Global)</h4>
                            <p className="text-xs text-pink-500/70">Everyone on this server can use this provider.</p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="pt-4">
                <Button variant="secondary" onClick={() => changeStep("ai-config")} className="h-12 w-full" disabled={isLoading}>Back</Button>
            </div>
        </div>
    );

    const renderChannelSelect = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 animate-fade-in">
                    <Icon name="MessageSquare" size={32} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold">Connect Channels</h2>
                <p className="text-zinc-400">Where should the bot live? Configure a primary channel.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {availableChannels.map((channel) => (
                    <button
                        key={channel.id}
                        onClick={() => {
                            setSelectedChannelId(channel.id);
                            setChannelConfig({});
                            changeStep("channel-config");
                        }}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center gap-3 group"
                    >
                        <Icon name={channel.id === "discord" ? "MessageCircle" : channel.id === "telegram" ? "Send" : "MessageSquare"} size={20} className="text-zinc-500 group-hover:text-zinc-300" />
                        <span className="font-bold text-sm capitalize text-zinc-300 group-hover:text-white">{channel.name}</span>
                    </button>
                ))}
            </div>

            <button onClick={() => changeStep("welcome")} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 font-medium uppercase tracking-widest pt-4">
                Skip Channel Setup
            </button>
        </div>
    );

    const renderChannelConfig = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 animate-fade-in">
                    <Icon name="Settings" size={32} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold">Configure {selectedChannel?.name}</h2>
                <p className="text-zinc-400">{selectedChannel?.description}</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {selectedChannel?.fields?.map((field: any) => (
                    <div key={field.id} className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            {field.label} {field.required && <span className="text-pink-500">*</span>}
                        </label>
                        <Input
                            type={field.type === 'password' ? 'password' : 'text'}
                            value={channelConfig[field.id] || ""}
                            onChange={e => setChannelConfig({ ...channelConfig, [field.id]: e.target.value })}
                            placeholder={field.placeholder}
                            autoFocus={field === selectedChannel.fields[0]}
                        />
                        {field.description && <p className="text-[10px] text-zinc-600">{field.description}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="secondary" onClick={() => changeStep("channel-select")} className="h-12" disabled={isLoading}>Back</Button>
                <Button variant="primary" onClick={handleSaveChannel} loading={isLoading} className="h-12">
                    Save Channel
                </Button>
            </div>
        </div>
    );

    const renderWelcome = () => (
        <div className="space-y-8 py-4">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 animate-fade-up">
                    <Icon name="Check" size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-white">You're all set!</h2>
                <p className="text-zinc-400 max-w-sm mx-auto">MinusBot is configured and ready to help you build amazing things.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <a href="/chat" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                        <Icon name="MessageSquare" size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-200">Start Chatting</h4>
                        <p className="text-xs text-zinc-500">Say hello to your new assistant</p>
                    </div>
                    <Icon name="ArrowRight" className="ml-auto text-zinc-600 group-hover:text-zinc-400" size={16} />
                </a>
            </div>

            <Button variant="primary" className="w-full h-12" onClick={() => setShouldShow(false)}>
                Go to Dashboard
            </Button>
        </div>
    );

    return (
        <FancyModal
            isOpen={shouldShow}
            title="Onboarding"
            status={error ? "error" : (step === "welcome" ? "success" : undefined)}
        >
            {step === "ai-provider" && renderAIProvider()}
            {step === "ai-credentials" && renderAICredentials()}
            {step === "ai-model" && renderAIModel()}
            {step === "ai-config" && renderAIConfig()}
            {step === "ai-scope" && renderAIScope()}

            {step === "channel-select" && renderChannelSelect()}
            {step === "channel-config" && renderChannelConfig()}

            {step === "welcome" && renderWelcome()}
        </FancyModal>
    );
};

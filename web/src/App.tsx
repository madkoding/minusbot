import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./stores/useAuthStore";
import { DashboardLayout } from "./components/layout";
import { LoginForm } from "./components/auth";

// Hooks for initialization
import { useUser } from "./hooks/useUsers";
import { useSettings } from "./hooks/useSettings";
import { useProviders } from "./hooks/useProviders";
import { useChannels } from "./hooks/useChannels";

// Views
import DashboardView from "./views/Dashboard.tsx";
import ChatView from "./views/Chat.tsx";
import SkillsView from "./views/Skills.tsx";
import ToolsView from "./views/Tools.tsx";
import UsersView from "./views/Users.tsx";
import VaultView from "./views/Vault.tsx";
import SettingsView from "./views/Settings.tsx";
import StatsView from "./views/Stats";
import IntegrationsView from "./views/Integrations.tsx";
import ChannelsView from "./views/Channels.tsx";
import UpdateView from "./views/Update.tsx";
import ProvidersView from "./views/Providers.tsx";

function Initializer({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isInitializing, initialize } = useAuthStore();
    const { fetchMe } = useUser();
    const { fetchSettings } = useSettings();
    const { fetchProviders } = useProviders();
    const { fetchChannels } = useChannels();

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMe();
            fetchSettings();
            fetchProviders();
            fetchChannels();
        }
    }, [isAuthenticated, fetchMe, fetchSettings, fetchProviders, fetchChannels]);

    if (isInitializing) {
        return (
            <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-12 animate-pulse">
                    <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150"></div>
                    <img src="/logo.png" className="w-24 h-24 md:w-32 md:h-32 relative z-10" alt="Minusbot" />
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-zinc-100 tracking-tighter mb-2">Minusbot</h1>
                <div className="flex items-center gap-3 text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
                    <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin"></div>
                    Recovering session...
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

export default function App() {
    const { isAuthenticated } = useAuthStore();

    return (
        <BrowserRouter>
            <Initializer>
                <Routes>
                    {/* Auth Routes */}
                    <Route
                        path="/login"
                        element={!isAuthenticated ? <LoginForm /> : <Navigate to="/" replace />}
                    />

                    {/* Protected Dashboard Routes */}
                    <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Navigate to="/chat" replace />} />

                        {/* Personal Routes */}
                        <Route path="/dashboard" element={<DashboardView />} />
                        <Route path="/chat" element={<ChatView />} />
                        <Route path="/chat/:id" element={<ChatView />} />
                        <Route path="/providers" element={<ProvidersView />} />
                        <Route path="/skills" element={<SkillsView mode="user" />} />
                        <Route path="/integrations" element={<IntegrationsView mode="user" />} />
                        <Route path="/channels" element={<ChannelsView mode="user" />} />
                        <Route path="/tools" element={<ToolsView mode="user" />} />
                        <Route path="/secrets" element={<VaultView mode="user" />} />
                        <Route path="/settings" element={<SettingsView mode="user" />} />

                        {/* Global Admin Routes */}
                        <Route path="/admin/skills" element={<SkillsView mode="admin" />} />
                        <Route path="/admin/secrets" element={<VaultView mode="admin" />} />
                        <Route path="/admin/settings" element={<SettingsView mode="admin" />} />
                        <Route path="/admin/users" element={<UsersView />} />
                        <Route path="/admin/stats" element={<StatsView />} />
                        <Route path="/admin/integrations" element={<IntegrationsView mode="admin" />} />
                        <Route path="/admin/channels" element={<ChannelsView mode="admin" />} />
                        <Route path="/admin/providers" element={<ProvidersView mode="admin" />} />

                        {/* System Routes */}
                        <Route path="/system/update" element={<UpdateView />} />
                        <Route path="/system/config" element={<SettingsView mode="system" />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
                </Routes>
            </Initializer>
        </BrowserRouter>
    );
}

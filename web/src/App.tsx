import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Sidebar } from "./components/Sidebar.tsx";
import { Card, Input, Button } from "./components/UI.tsx";
import { api } from "./api.ts";

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

export default function App() {
    const [page, setPage] = useState('login');
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            try {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                setUser(userData);
                setPage('app');
            } catch {
                localStorage.clear();
                setToken(null);
            }
        }
    }, [token]);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', {
                username: e.target.username.value,
                password: e.target.password.value
            });
            const data = res.data;
            setToken(data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            setPage('app');
        } catch {
            alert("Authentication invalid.");
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.reload();
    };

    if (page === 'login') return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505]">
            <div className="w-full max-sm:max-w-xs max-w-sm space-y-12 animate-fade-up">
                <div className="text-center space-y-4">
                    <div className="inline-flex w-16 h-16 rounded-2xl bg-zinc-50/5 items-center justify-center mb-2 overflow-hidden border border-zinc-800/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        <img src="/logo.png" className="w-full h-full object-cover" alt="Minusbot" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-zinc-100 uppercase italic">MINUSBOT</h1>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Your personal assistant</p>
                </div>

                <Card className="border-zinc-800/50 bg-zinc-900/20 backdrop-blur-2xl p-8 rounded-3xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input label="Username" name="username" placeholder="Enter username" required />
                        <Input label="Password" name="password" type="password" placeholder="••••••••" required />
                        <Button className="w-full h-12 rounded-2xl text-base font-bold tracking-tight">Login</Button>
                    </form>
                </Card>
            </div>
        </div>
    );

    return (
        <BrowserRouter>
            <div className="flex bg-[#070707] h-screen overflow-hidden">
                <Sidebar user={user} onLogout={logout} />

                <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {/* Personal Routes */}
                            <Route path="/dashboard" element={<DashboardView />} />
                            <Route path="/chat" element={<ChatView />} />
                            <Route path="/chat/:id" element={<ChatView />} />
                            <Route path="/skills" element={<SkillsView apiPath="/user/skills" />} />
                            <Route path="/integrations" element={<IntegrationsView />} />
                            <Route path="/tools" element={<ToolsView apiPath="/user/settings" />} />
                            <Route path="/secrets" element={<VaultView apiPath="/user/vault" />} />
                            <Route path="/settings" element={<SettingsView apiPath="/user/settings" />} />

                            {/* Global Admin Routes */}
                            <Route path="/admin/skills" element={<SkillsView apiPath="/admin/skills" />} />
                            <Route path="/admin/secrets" element={<VaultView apiPath="/admin/vault" />} />
                            <Route path="/admin/settings" element={<SettingsView apiPath="/admin/settings/global" />} />
                            <Route path="/admin/users" element={<UsersView />} />
                            <Route path="/admin/stats" element={<StatsView apiPath="/admin/stats" />} />


                            {/* System Routes */}
                            <Route path="/system/config" element={<SettingsView apiPath="/admin/settings/system" />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </BrowserRouter>
    );
}

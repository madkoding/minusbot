import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "../navigation/Sidebar";
import { MobileHeader } from "../navigation/MobileHeader";
import { useAuthStore } from "../../stores/useAuthStore";
import { useLocation } from "react-router-dom";

export const DashboardLayout: React.FC = () => {
    const { isAuthenticated, isInitializing } = useAuthStore();
    const location = useLocation();

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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const getTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Activity Overview';
        if (path.startsWith('/chat')) return 'Chat';
        if (path === '/skills') return 'Skills';
        if (path === '/integrations') return 'Integrations';
        if (path === '/channels') return 'Channels';
        if (path === '/providers') return 'AI Providers';
        if (path === '/tools') return 'Settings';
        if (path === '/secrets') return 'Vault';
        if (path === '/settings') return 'Preferences';
        if (path.includes('admin/skills')) return 'Admin Skills';
        if (path.includes('admin/secrets')) return 'Admin Vault';
        if (path.includes('admin/settings')) return 'Admin Settings';
        if (path.includes('admin/users')) return 'Users';
        if (path.includes('admin/stats')) return 'System Stats';
        if (path.includes('system/update')) return 'Update';
        return 'Minusbot';
    };

    return (
        <div className="min-h-[100dvh] bg-[#070707] lg:flex overflow-hidden relative">
            <Sidebar />

            <main className="flex-1 min-w-0 w-full lg:w-auto h-[100dvh] relative overflow-hidden flex flex-col">
                {!location.pathname.startsWith('/chat') && <MobileHeader title={getTitle()} />}
                <div className="flex-1 overflow-hidden h-full">
                    {location.pathname.startsWith('/chat') ? (
                        <Outlet />
                    ) : (
                        <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-12">
                            <div className="max-w-[1400px] mx-auto w-full">
                                <Outlet />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

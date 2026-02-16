import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "../icons/Icon";
import { useAuthStore } from "../../stores/useAuthStore";
import { chatService } from "../../services/chatService";
import { useStats } from "../../hooks/useStats";
import { updateService } from "../../services/updateService";

type SidebarMode = 'chats' | 'user' | 'admin' | 'system';

export const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'root';
    const isRoot = user?.role === 'root';
    const location = useLocation();

    // Determine initial mode based on current URL
    const getInitialMode = (): SidebarMode => {
        if (location.pathname.startsWith('/chat')) return 'chats';
        if (location.pathname.startsWith('/system')) return 'system';
        if (location.pathname.startsWith('/admin')) return 'admin';
        return 'user';
    };

    const [mode, setMode] = React.useState<SidebarMode>(getInitialMode());
    const [chats, setChats] = React.useState<any[]>([]);

    const loadChats = async () => {
        const data = await chatService.list();
        setChats(data);
    };

    // Update mode when location changes (in case of direct navigation)
    React.useEffect(() => {
        const newMode = getInitialMode();
        setMode(newMode);
        if (newMode === 'chats') loadChats();
    }, [location.pathname]);

    const personalItems = [
        { id: '/dashboard', label: 'Overview', icon: 'dashboard' },
        { id: '/skills', label: 'Cognitive Skills', icon: 'shield' },
        { id: '/integrations', label: 'Integrations', icon: 'globe' },
        { id: '/channels', label: 'Channels', icon: 'chat_alt' },
        { id: '/tools', label: 'System Tooling', icon: 'terminal' },
        { id: '/secrets', label: 'Secure Vault', icon: 'vault' },
        { id: '/settings', label: 'Preferences', icon: 'settings' },
    ];

    const adminItems = [
        { id: '/admin/stats', label: 'Global Overview', icon: 'dashboard' },
        { id: '/admin/skills', label: 'Global Skills', icon: 'shield' },
        { id: '/admin/integrations', label: 'Global Integrations', icon: 'globe' },
        { id: '/admin/channels', label: 'Global Channels', icon: 'chat_alt' },
        { id: '/admin/secrets', label: 'Global Vault', icon: 'vault' },
        { id: '/admin/settings', label: 'Global Config', icon: 'settings' },
        { id: '/admin/users', label: 'User Directory', icon: 'users' },
    ];

    const [updateCount, setUpdateCount] = React.useState(0);

    const checkUpdates = async () => {
        try {
            const data = await updateService.getStatus();
            setUpdateCount(data.updates.length);
        } catch { }
    };

    React.useEffect(() => {
        if (isRoot) {
            checkUpdates();
            const interval = setInterval(checkUpdates, 60000 * 60); // Check every hour
            return () => clearInterval(interval);
        }
    }, [isRoot]);

    const systemItems = [
        { id: '/system/update', label: 'Update System', icon: 'loader', badge: updateCount > 0 ? updateCount : undefined },
        { id: '/system/config', label: 'System Config', icon: 'settings' },
    ];

    const { adminStats: sysStats, fetchAdminStats } = useStats();

    React.useEffect(() => {
        if (!isRoot) return;
        fetchAdminStats();
        const interval = setInterval(fetchAdminStats, 10000);
        return () => clearInterval(interval);
    }, [isRoot, fetchAdminStats]);

    const formatBytes = (bytes: number) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        if (!seconds) return "0s";
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
    };

    const renderGroup = (label: string, items: any[]) => (
        <div>
            <h2 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 mb-4">{label}</h2>
            <nav className="space-y-2">
                {items.map(item => (
                    <NavLink
                        key={item.id}
                        to={item.id}
                        className={({ isActive }: any) => `
                            group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150
                            ${isActive
                                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40'}
                        `}
                    >
                        <Icon name={item.icon} size={16} />
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                            <span className="ml-auto bg-emerald-500 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );

    return (
        <>
            {/* Primary Sidebar (Rail) */}
            <aside className="w-16 bg-[#050505] border-r border-zinc-900 flex flex-col items-center py-6 h-screen sticky top-0 overflow-y-auto custom-scrollbar z-50">
                <div className="mb-10">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900/50 border border-zinc-800/40 flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                    <NavLink
                        to="/chat"
                        onClick={() => setMode('chats')}
                        className={`p-2.5 rounded-xl transition-all ${mode === 'chats' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
                        title="Chats"
                    >
                        <Icon name="chat" size={18} />
                    </NavLink>

                    <button
                        onClick={() => setMode('user')}
                        className={`p-2.5 rounded-xl transition-all ${mode === 'user' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
                        title="Personal"
                    >
                        <Icon name="user" size={18} />
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => setMode('admin')}
                            className={`p-2.5 rounded-xl transition-all ${mode === 'admin' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
                            title="Admin"
                        >
                            <Icon name="shield" size={18} />
                        </button>
                    )}

                    {isRoot && (
                        <button
                            onClick={() => setMode('system')}
                            className={`p-2.5 rounded-xl transition-all ${mode === 'system' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
                            title="System"
                        >
                            <Icon name="terminal" size={18} />
                        </button>
                    )}
                </div>

                <div className="mt-auto flex flex-col items-center gap-4 pt-6 border-t border-zinc-900 w-full">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-black text-zinc-100 border border-zinc-700/50 shadow-lg cursor-help group relative" title={user?.username}>
                        {user?.username?.[0].toUpperCase()}
                    </div>

                    <button
                        onClick={logout}
                        className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Logout"
                    >
                        <Icon name="logout" size={18} />
                    </button>
                </div>
            </aside>

            {/* Secondary Sidebar (Content) */}
            <aside className="w-60 bg-[#070707] border-r border-zinc-900 flex flex-col p-5 h-screen sticky top-0 overflow-y-auto custom-scrollbar z-40">
                <div className="mb-8 px-2 flex items-center h-8">
                    <h1 className="text-lg font-black tracking-tight text-zinc-100 uppercase italic">
                        {mode === 'chats' && 'Messages'}
                        {mode === 'user' && 'Personal'}
                        {mode === 'admin' && 'Admin'}
                        {mode === 'system' && 'Root'}
                    </h1>
                </div>

                <div className="flex-1">
                    {mode === 'chats' && (
                        <div className="space-y-6">
                            <NavLink
                                to="/chat"
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md active:scale-[0.98] transition-all"
                            >
                                <Icon name="plus" size={14} />
                                <span>New Interaction</span>
                            </NavLink>

                            <div className="space-y-1">
                                <h2 className="px-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 mb-3">History</h2>
                                {chats.map(c => (
                                    <NavLink
                                        key={c.id}
                                        to={`/chat/${c.id}`}
                                        className={({ isActive }: any) => `
                                            w-full text-left px-3 py-2 rounded-xl border transition-all block
                                            ${isActive
                                                ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-sm'
                                                : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300'}
                                        `}
                                    >
                                        <div className="text-[11px] font-bold truncate">/ {c.id}</div>
                                        <div className="text-[9px] font-medium opacity-40">
                                            {new Date(c.last_activity).toLocaleDateString()}
                                        </div>
                                    </NavLink>
                                ))}
                                {chats.length === 0 && (
                                    <div className="px-3 py-10 flex flex-col items-center justify-center gap-2 opacity-20">
                                        <Icon name="chat" size={24} />
                                        <div className="text-[9px] font-black uppercase tracking-widest text-center">
                                            Registry Empty
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {mode === 'user' && renderGroup("Preferences", personalItems)}
                    {mode === 'admin' && isAdmin && renderGroup("Management", adminItems)}
                    {mode === 'system' && isRoot && renderGroup("Core", systemItems)}
                </div>

                {isRoot && mode === 'system' && sysStats && (
                    <div className="mt-6 px-3 py-4 rounded-xl bg-zinc-900/20 border border-zinc-800/30 space-y-3 shadow-inner">
                        <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">Monitor</h2>
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
                                    <span className="text-zinc-600">RAM</span>
                                    <span className="text-zinc-400">{formatBytes(sysStats?.memory?.used)}</span>
                                </div>
                                <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-500 transition-all duration-500" style={{ width: `${sysStats?.memory?.percentage || 0}%` }}></div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
                                    <span className="text-zinc-600">CPU</span>
                                    <span className="text-zinc-400">{(sysStats?.cpu * 10).toFixed(1)}%</span>
                                </div>
                                <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-500 transition-all duration-500" style={{ width: `${(sysStats?.cpu * 10) || 0}%` }}></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-zinc-900/50">
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-600">Up</span>
                                <span className="text-[9px] font-bold text-zinc-400 tabular-nums">{formatUptime(sysStats?.uptime)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

import React from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "./UI.tsx";

export const Sidebar = ({ user, onLogout }: any) => {
    const isAdmin = user?.role === 'admin' || user?.role === 'root';
    const isRoot = user?.role === 'root';

    const personalItems = [
        { id: '/dashboard', label: 'Overview', icon: 'dashboard' },
        { id: '/interaction', label: 'Message', icon: 'chat' },
        { id: '/skills', label: 'Skills', icon: 'send' },
        { id: '/tools', label: 'Tools', icon: 'settings' },
        { id: '/secrets', label: 'Vault', icon: 'vault' },
        { id: '/settings', label: 'Preferences', icon: 'settings' },
    ];

    const adminItems = [
        { id: '/admin/stats', label: 'Resource Monitor', icon: 'dashboard' }, // Moved from Overview
        { id: '/admin/skills', label: 'Global Skills', icon: 'send' },
        { id: '/admin/secrets', label: 'Global Vault', icon: 'vault' },
        { id: '/admin/settings', label: 'Global Config', icon: 'settings' },
        { id: '/admin/users', label: 'User Directory', icon: 'users' },
        { id: '/admin/chats', label: 'Auditing', icon: 'chat' },
    ];

    const systemItems = [
        { id: '/system/config', label: 'System Config', icon: 'settings' },
    ];

    const renderGroup = (label: string, items: any[]) => (
        <div className="mb-8">
            <h2 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 mb-4">{label}</h2>
            <nav className="space-y-1">
                {items.map(item => (
                    <NavLink
                        key={item.id}
                        to={item.id}
                        className={({ isActive }: any) => `
                            group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${isActive
                                ? 'bg-zinc-100 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'}
                        `}
                    >
                        <Icon name={item.icon} size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );

    return (
        <aside className="w-72 border-r border-zinc-800/40 bg-zinc-950 flex flex-col p-6 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
            <div className="mb-10 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-sm bg-zinc-950"></div>
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter text-zinc-100 uppercase italic">MINUSBOT</h1>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.1em] -mt-1">Pocket Assistant</p>
                    </div>
                </div>
            </div>

            {renderGroup("Personal", personalItems)}
            {isAdmin && renderGroup("Global Management", adminItems)}
            {isRoot && renderGroup("System Management", systemItems)}

            <div className="mt-auto pt-6 border-t border-zinc-800/50">
                <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-300 border border-zinc-700/50">
                            {user?.username?.[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-xs font-bold text-zinc-100 truncate">{user?.username}</div>
                            <div className="text-[10px] text-zinc-500 font-medium capitalize mt-0.5">{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 text-zinc-600 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <Icon name="logout" size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

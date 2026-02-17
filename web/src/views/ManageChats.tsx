import React, { useEffect } from "react";
import { Card } from "../components/cards";
import { Icon } from "../components/icons";
import { useAdminChats } from "../hooks/useAdminChats";

export default function ManageChatsView() {
    const { adminChats, fetchAdminChats, deleteChat, isLoading } = useAdminChats();

    useEffect(() => { fetchAdminChats(); }, [fetchAdminChats]);

    const handleRemove = async (owner: string, id: string) => {
        if (!confirm("Destroy chat history?")) return;
        await deleteChat(owner, id);
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12">
            <div className="space-y-8 md:space-y-12 max-w-6xl mx-auto">
                <header>
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">Active Chats</h2>
                        <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium max-w-lg">View and manage all active chat sessions.</p>
                </header>

                <Card className="px-0 py-2 overflow-hidden border-zinc-800/30">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800/50 text-zinc-500">
                                <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Reference</th>
                                <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Owner</th>
                                <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Activity</th>
                                <th className="text-right py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/20">
                            {adminChats.map(c => (
                                <tr key={c.id} className="group hover:bg-zinc-900/40 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-zinc-200">{c.id}</div>
                                        <div className="text-[10px] font-mono text-zinc-600 uppercase">VOL: {c.message_count} MSG</div>
                                    </td>
                                    <td className="py-4 px-6 font-medium text-zinc-400">
                                        <span className="bg-zinc-900 px-2 py-1 rounded text-xs border border-zinc-800">{c.owner}</span>
                                    </td>
                                    <td className="py-4 px-6 text-xs text-zinc-500">{new Date(c.last_activity).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right">
                                        <button onClick={() => handleRemove(c.owner, c.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {adminChats.length === 0 && !isLoading && (
                        <div className="py-20 text-center">
                            <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">No chats found</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

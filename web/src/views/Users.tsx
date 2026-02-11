import React, { useState, useEffect } from "react";
import { Card, Input, Button, Icon } from "../components/UI.tsx";
import { api } from "../api.ts";

export default function UsersView() {
    const [users, setUsers] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    const load = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error("Failed to load users", e);
        }
    };

    useEffect(() => { load(); }, []);

    const deleteUser = async (id: string) => {
        if (id === 'root') return alert("Cannot delete root");
        if (!confirm("Delete user?")) return;
        await api.delete(`/admin/users/${id}`);
        load();
    };

    const addUser = async (e: any) => {
        e.preventDefault();
        const data = {
            username: e.target.username.value,
            password: e.target.password.value,
            role: e.target.role.value
        };
        try {
            await api.post('/admin/users', data);
            setIsAdding(false);
            load();
        } catch (e: any) {
            alert(e.response?.data || "Failed to create user");
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-100">Identity</h2>
                    <p className="text-zinc-500 mt-1">Manage system access and privileges.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant="secondary" size="sm" className="rounded-xl border-zinc-800">
                    <Icon name="plus" size={16} /> <span className="ml-2">{isAdding ? 'Cancel' : 'New User'}</span>
                </Button>
            </header>

            {isAdding && (
                <Card title="Register Access" className="border-dashed border-zinc-700">
                    <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <Input label="Username" name="username" placeholder="alex_dev" required />
                        <Input label="Password" name="password" type="password" placeholder="••••••••" required />
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Role</label>
                            <select name="role" className="flex h-11 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button className="h-11 rounded-xl">Create Identity</Button>
                    </form>
                </Card>
            )}

            <Card className="px-0 py-2 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-800/50 text-zinc-500">
                            <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">User</th>
                            <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Privileges</th>
                            <th className="text-right py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {users.map(u => (
                            <tr key={u?.id || Math.random()} className="group hover:bg-zinc-800/20 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="font-bold text-zinc-200">{u?.username || "Unknown"}</div>
                                    <div className="text-[10px] font-mono text-zinc-600 mt-0.5 uppercase tracking-tighter">REF: {u?.id || "N/A"}</div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${u?.role === 'root' ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        {u?.role || "user"}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    {u?.id !== 'root' && (
                                        <button
                                            onClick={() => deleteUser(u.id)}
                                            className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                                        >
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}

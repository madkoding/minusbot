import React, { useState, useEffect } from "react";
import { Button, Input } from "../components/ui";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { useUsers } from "../hooks/useUsers";

export default function UsersView() {
    const { users, fetchUsers, createUser, deleteUser, isLoading, error } = useUsers();
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => { load(); }, []);

    const load = () => fetchUsers();

    const handleDeleteUser = async (id: string) => {
        if (id === 'root') return alert("Cannot delete root");
        if (!confirm("Delete user?")) return;
        await deleteUser(id);
    };

    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const success = await createUser(data);
        if (success) {
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-100">Users</h2>
                    <p className="text-zinc-500 mt-1">Manage system access and privileges.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant="secondary" size="sm" className="rounded-xl border-zinc-800">
                    <Icon name="plus" size={16} /> <span className="ml-2">{isAdding ? 'Cancel' : 'New User'}</span>
                </Button>
            </header>

            {isAdding && (
                <Card title="Register User" className="border-dashed border-zinc-700">
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <Input label="Username" name="username" placeholder="alex_dev" required />
                        <Input label="Password" name="password" type="password" placeholder="••••••••" required />
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Role</label>
                            <select name="role" className="flex h-11 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button type="submit" className="h-11 rounded-xl" loading={isLoading}>Register User</Button>
                    </form>
                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
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
                                            onClick={() => handleDeleteUser(u.id)}
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
                {users.length === 0 && !isLoading && (
                    <div className="py-20 text-center">
                        <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">No users found.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

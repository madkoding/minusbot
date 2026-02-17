import React, { useState, useEffect } from "react";
import { Button, Input } from "../components/ui";
import { Icon } from "../components/icons";
import { Card } from "../components/cards";
import { Skeleton } from "../components/ui";
import { useUsersAsAdmin } from "../hooks/useUsers";

export default function UsersView() {
    const { users, fetchUsers, createUser, deleteUser, isLoading, error } = useUsersAsAdmin();
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
        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 uppercase italic">Users</h2>
                        <div className="h-px w-12 bg-zinc-800 ml-2"></div>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium max-w-lg">Manage user access and permissions for your assistant.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant="secondary" size="sm" className="rounded-xl border-zinc-800 w-full md:w-auto h-11 px-6 shadow-xl">
                    <Icon name="plus" size={16} /> <span className="ml-2">{isAdding ? 'Cancel' : 'Add User'}</span>
                </Button>
            </header>

            {isAdding && (
                <Card title="Register User" className="border-dashed border-zinc-700 p-4 md:p-6">
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <Input label="Username" name="username" placeholder="alex_dev" required />
                        <Input label="Password" name="password" type="password" placeholder="••••••••" required />
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Role</label>
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

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm min-w-[600px]">
                        <thead>
                            <tr className="border-b border-zinc-800/50 text-zinc-500">
                                <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">User</th>
                                <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Role</th>
                                <th className="text-right py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {users.map(u => (
                                <tr key={u?.id || Math.random()} className={`group hover:bg-zinc-800/20 transition-colors ${isLoading ? 'opacity-70' : ''}`}>
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-zinc-200 text-sm">{u?.username || "Unknown"}</div>
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

                            {isLoading && (
                                <>
                                    {[1, 2, 3].map(i => (
                                        <tr key={`skeleton-${i}`} className="animate-pulse">
                                            <td className="py-4 px-6">
                                                <Skeleton className="h-4 w-24 mb-1" />
                                                <Skeleton className="h-2 w-16" />
                                            </td>
                                            <td className="py-4 px-6">
                                                <Skeleton className="h-4 w-12 rounded" />
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && !isLoading && (
                    <div className="py-20 text-center">
                        <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">No users found.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

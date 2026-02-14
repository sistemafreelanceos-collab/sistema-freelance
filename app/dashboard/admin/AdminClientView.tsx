"use client";

import { useState } from "react";
import { updateUserRole } from "../../actions/admin";
import { toast } from "sonner";
import { ShieldCheckIcon, UserIcon } from "@heroicons/react/24/outline";

export default function AdminClientView({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
        setLoadingId(userId);
        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`Rol actualizado a ${newRole}`);
        } catch (error) {
            toast.error("Error al actualizar rol");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#0D1117] text-gray-200 uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Rol Actual</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                    {user.nombre?.charAt(0) || "?"}
                                </div>
                                <span className="font-medium text-white">{user.nombre}</span>
                            </td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                    }`}>
                                    {user.role === 'admin' ? <ShieldCheckIcon className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <select
                                    disabled={loadingId === user.id}
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                                    className="bg-[#0D1117] border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 transition"
                                >
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

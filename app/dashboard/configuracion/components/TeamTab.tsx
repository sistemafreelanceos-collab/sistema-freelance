"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";
import { UserPlusIcon, TrashIcon, ShieldCheckIcon, UserIcon, EnvelopeIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function TeamTab() {
    const { currentWorkspace, currentRole } = useWorkspace();
    const [members, setMembers] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [loading, setLoading] = useState(true);
    const [sendingInvite, setSendingInvite] = useState(false);

    const fetchData = async () => {
        if (!currentWorkspace?.id) return;
        setLoading(true);

        // 1. Fetch Members
        const { data: membersData, error: membersError } = await supabase
            .from("workspace_members")
            .select(`
                id, role, joined_at, user_id,
                profiles:user_id (nombre, email, avatar_url)
             `)
            .eq("workspace_id", currentWorkspace.id);

        if (membersError) console.error("Error fetching members:", membersError);
        else setMembers(membersData || []);

        // 2. Fetch Pending Invites
        const { data: invitesData, error: invitesError } = await supabase
            .from("workspace_invites")
            .select("*")
            .eq("workspace_id", currentWorkspace.id)
            .eq("status", "pending");

        if (invitesError) console.error("Error fetching invites:", invitesError);
        else setInvites(invitesData || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [currentWorkspace]);

    const handleInvite = async () => {
        if (!inviteEmail) return;
        if (!currentWorkspace) return;

        setSendingInvite(true);
        // Insert into workspace_invites
        const { data, error } = await supabase.from("workspace_invites").insert({
            workspace_id: currentWorkspace.id,
            email: inviteEmail,
            role: inviteRole,
            status: 'pending' // Default status
        }).select().single();

        if (error) {
            toast.error("Error: " + error.message);
        } else {
            // Generate Magic Link (Simulation for V1)
            // In a real app we would send this via email.
            // Here we copy it to clipboard.
            const inviteLink = `${window.location.origin}/invite?token=${data.token}`;
            navigator.clipboard.writeText(inviteLink);
            toast.success(`Invitación creada. Enlace copiado al portapapeles: ${inviteLink}`);
            setInviteEmail("");
            fetchData();
        }
        setSendingInvite(false);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (currentRole !== 'owner') {
            toast.error("Solo el dueño puede eliminar miembros");
            return;
        }

        toast("¿Eliminar miembro?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
                    if (error) toast.error(error.message);
                    else {
                        toast.success("Miembro eliminado");
                        fetchData();
                    }
                }
            }
        });
    };

    const handleRevokeInvite = async (inviteId: string) => {
        const { error } = await supabase.from("workspace_invites").delete().eq("id", inviteId);
        if (error) toast.error("Error al revocar");
        else {
            toast.success("Invitación revocada");
            fetchData();
        }
    };

    if (!currentWorkspace) return <div className="text-zinc-500">Selecciona una empresa primero.</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Equipo de {currentWorkspace.name}</h2>
                    <p className="text-zinc-400 text-sm">Gestiona quién tiene acceso a este espacio de trabajo.</p>
                </div>
                {/* Plan Badge */}
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                    {members.length} / 5 Miembros (Plan Pro)
                </span>
            </div>

            {/* Invite Box */}
            <div className="bg-[#1C1C1E] border border-white/5 p-6 rounded-2xl">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5 text-emerald-500" />
                    Invitar nuevo miembro
                </h3>
                <div className="flex gap-4">
                    <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                        <option value="member">Miembro</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Visor</option>
                    </select>
                    <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                        onClick={handleInvite}
                        disabled={!inviteEmail || sendingInvite}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-2 rounded-lg transition-all"
                    >
                        {sendingInvite ? "Creando..." : "Enviar Invitación"}
                    </button>
                </div>
                <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
                    <EnvelopeIcon className="w-3 h-3" />
                    Se generará un enlace mágico que podrás compartir manualmente.
                </p>
            </div>

            {/* Invites List (Pending) */}
            {invites.length > 0 && (
                <div className="bg-[#1C1C1E] border border-yellow-500/20 rounded-2xl overflow-hidden mb-6">
                    <div className="p-4 bg-yellow-500/5 border-b border-yellow-500/10 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-yellow-500" />
                        <h4 className="text-sm font-bold text-yellow-500 uppercase">Invitaciones Pendientes</h4>
                    </div>
                    <div className="divide-y divide-white/5">
                        {invites.map(invite => (
                            <div key={invite.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition">
                                <div>
                                    <p className="text-white font-medium">{invite.email}</p>
                                    <p className="text-xs text-zinc-500">Rol: {invite.role} • Enviado: {new Date(invite.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <button
                                        onClick={() => {
                                            const link = `${window.location.origin}/invite?token=${invite.token}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success("Enlace copiado");
                                        }}
                                        className="text-xs text-emerald-400 hover:underline"
                                    >
                                        Copiar Link
                                    </button>
                                    <button
                                        onClick={() => handleRevokeInvite(invite.id)}
                                        className="text-xs text-red-400 hover:underline"
                                    >
                                        Revocar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Usuario</th>
                            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Rol</th>
                            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Se unió</th>
                            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Cargando miembros...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No hay miembros aún.</td></tr>
                        ) : members.map((member) => (
                            <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs overflow-hidden">
                                            {member.profiles?.avatar_url ? (
                                                <img src={member.profiles.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-4 h-4 text-zinc-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{member.profiles?.nombre || "Usuario"}</p>
                                            <p className="text-xs text-zinc-500">{member.profiles?.email || "..."}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${member.role === 'owner'
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        }`}>
                                        {member.role === 'owner' ? 'Dueño' : 'Miembro'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-zinc-400">
                                    {new Date(member.joined_at).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    {member.role !== 'owner' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Eliminar miembro"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

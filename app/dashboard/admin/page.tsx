import { redirect } from "next/navigation";
import { checkIsAdmin, getAdminUsers, updateUserRole } from "../../actions/admin";
import { UserXP } from "@/types"; // Ajustar si el tipo ProfileDB está ahí
import AdminClientView from "./AdminClientView";

export default async function AdminPage() {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
        redirect("/dashboard");
    }

    const users = await getAdminUsers();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">🏰 Fortaleza del Administrador</h1>
                <p className="text-gray-400">Gestiona usuarios y permisos de la plataforma.</p>
            </div>

            <div className="bg-[#161B22] border border-white/10 rounded-xl overflow-hidden">
                <AdminClientView initialUsers={users} />
            </div>
        </div>
    );
}

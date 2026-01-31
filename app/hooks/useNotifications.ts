"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Notification } from "@/types";
import { toast } from "sonner";

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // 1. Notificaciones de BD
            let dbNotifications: Notification[] = [];
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!error && data) dbNotifications = data as Notification[];
            } catch (err) {
                console.warn("Tabla notifications no disponible o error:", err);
            }

            // 2. Notificaciones Virtuales (Tareas y Pagos) - "Smart Logic"
            let virtualNotifications: Notification[] = [];
            try {
                const hoy = new Date();
                const manana = new Date();
                manana.setDate(manana.getDate() + 1);

                // Tareas próximas
                const { data: tareas } = await supabase
                    .from('tareas')
                    .select('*')
                    .eq('owner_id', user.id)
                    .eq('completada', false)
                    .lte('fecha', manana.toISOString().split('T')[0]);

                tareas?.forEach((t: any) => {
                    virtualNotifications.push({
                        id: `task-${t.id}`,
                        user_id: user.id,
                        title: t.fecha < hoy.toISOString().split('T')[0] ? "⚠️ Tarea Vencida" : "📅 Tarea para hoy/mañana",
                        message: `${t.titulo} - ${t.hora || ''}`,
                        type: t.fecha < hoy.toISOString().split('T')[0] ? 'error' : 'info',
                        read: false,
                        created_at: t.created_at || new Date().toISOString(),
                        link: `/dashboard/calendario?date=${t.fecha}`
                    });
                });

                // Proyectos por cobrar (simplificado)
                const { data: proyectos } = await supabase
                    .from('proyectos')
                    .select('*')
                    .eq('owner_id', user.id)
                    .neq('estado', 'cancelado')
                    .not('proximo_pago', 'is', null);

                proyectos?.forEach((p: any) => {
                    const fPago = new Date(p.proximo_pago);
                    const diffDays = Math.ceil((fPago.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

                    if (diffDays >= -5 && diffDays <= 3) {
                        virtualNotifications.push({
                            id: `proj-${p.id}`,
                            user_id: user.id,
                            title: diffDays < 0 ? "💰 Cobro Atrasado" : "💰 Cobro Cercano",
                            message: `Proyecto: ${p.nombre}`,
                            type: 'success', // Green for money
                            read: false,
                            created_at: new Date().toISOString(),
                            link: `/dashboard/proyectos/${p.id}`
                        });
                    }
                });

            } catch (virtualErr) {
                console.error("Error generating virtual notifications", virtualErr);
            }

            // Mezclar y ordenar
            const combined = [...dbNotifications, ...virtualNotifications];
            return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        },
        refetchInterval: 60000,
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: () => {
            toast.error("Error al actualizar notificación");
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success("Todas marcadas como leídas");
        }
    });

    return {
        notifications,
        isLoading,
        unreadCount,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate
    };
};

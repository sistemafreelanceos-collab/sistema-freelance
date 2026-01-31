
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Movimiento } from "../../../../types";

interface Props {
    movimientos: Movimiento[];
    moneda: string;
}

export default function FinancialProjectionChart({ movimientos, moneda }: Props) {
    // 1. Calcular promedio mensual de ingresos (últimos 3 meses)
    const calculateProjection = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Agrupar ingresos por mes
        const incomeByMonth: Record<string, number> = {};
        movimientos
            .filter(m => m.tipo === 'ingreso')
            .forEach(m => {
                const d = new Date(m.fecha);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                incomeByMonth[key] = (incomeByMonth[key] || 0) + m.monto;
            });

        // Tomar últimos 3 meses (excluyendo actual si está incompleto, o incluirlo)
        // Simple: Tomar todo el histórico y sacar promedio
        const months = Object.keys(incomeByMonth).length || 1;
        const totalIncome = Object.values(incomeByMonth).reduce((a, b) => a + b, 0);
        const averageIncome = totalIncome / months;

        // Generar data para gráfica (3 meses atrás + 12 futuro)
        const data = [];

        // Pasado (3 meses)
        for (let i = 3; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            data.push({
                name: d.toLocaleString('es-ES', { month: 'short' }),
                real: incomeByMonth[key] || 0,
                proyeccion: null
            });
        }

        // Futuro (12 meses)
        for (let i = 1; i <= 12; i++) {
            const d = new Date(currentYear, currentMonth + i, 1);
            data.push({
                name: d.toLocaleString('es-ES', { month: 'short' }),
                real: null,
                proyeccion: averageIncome // Proyección Lineal (Conservadora) valdría Average * 1.05 ^^ i para crecimiento
            });
        }

        return { data, averageIncome };
    };

    const { data, averageIncome } = calculateProjection();

    return (
        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                        🚀 Proyección Financiera
                    </h3>
                    <p className="text-xs text-gray-500">Estimación basada en tu histórico.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Proyección Anual</p>
                    <p className="text-xl font-bold text-indigo-400">
                        $ {(averageIncome * 12).toLocaleString()} <span className="text-xs text-gray-600">{moneda}</span>
                    </p>
                </div>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#E5E7EB' }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        />
                        <Area type="monotone" dataKey="real" stroke="#10B981" fillOpacity={1} fill="url(#colorReal)" name="Ingreso Real" />
                        <Area type="monotone" dataKey="proyeccion" stroke="#6366F1" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProj)" name="Proyección" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

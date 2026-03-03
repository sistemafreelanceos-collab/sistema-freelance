"use client";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

// ── Styles ─────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    page: { backgroundColor: "#0D1117", color: "#E5E7EB", padding: 40, fontFamily: "Helvetica" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid #1F2937" },
    brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
    brandAccent: { color: "#10B981" },
    headerRight: { alignItems: "flex-end" },
    reciboLabel: { fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 },
    reciboNum: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginTop: 2 },
    fechaText: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },

    infoBox: { backgroundColor: "#161B22", borderRadius: 8, padding: 14, borderLeft: "3px solid #4F46E5" },
    infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    infoLabel: { fontSize: 10, color: "#9CA3AF" },
    infoValue: { fontSize: 10, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },

    montoBox: { backgroundColor: "#052E16", borderRadius: 8, padding: 20, alignItems: "center", marginBottom: 24, border: "1px solid #166534" },
    montoLabel: { fontSize: 11, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    montoValue: { fontSize: 36, fontFamily: "Helvetica-Bold", color: "#10B981" },
    monedaText: { fontSize: 14, color: "#6EE7B7", marginTop: 2 },

    divider: { borderBottom: "1px solid #1F2937", marginVertical: 20 },

    footer: { marginTop: "auto", paddingTop: 20, borderTop: "1px solid #1F2937", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    footerNote: { fontSize: 8, color: "#4B5563", maxWidth: "60%" },
    statusBadge: { backgroundColor: "#10B981", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 9, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
});

// ── Data Types ──────────────────────────────────────────────────────────────
export interface ProveedorReciboData {
    numero: string;          // Número de recibo ej: "PGO-001"
    fecha: string;           // "2026-03-03"
    proveedor: {
        nombre: string;
        empresa?: string;
        especialidad?: string;
    };
    proyecto?: string;        // Nombre del proyecto
    monto: number;
    moneda: string;
    descripcion?: string;
    cuenta?: string;          // Nombre de cuenta de salida
    estado: "pagado" | "pendiente";
}

// ── PDF Document ────────────────────────────────────────────────────────────
function ProveedorReciboPDF({ data }: { data: ProveedorReciboData }) {
    const fechaFmt = (d: string) => {
        const [y, m, day] = d.split("-");
        const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return `${day} de ${meses[Number(m)]} de ${y}`;
    };

    const montoFmt = (n: number, mon: string) =>
        new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " " + mon;

    return (
        <Document title={`Recibo-${data.numero}`} author="OnyxOS">
            <Page size="A4" style={S.page}>
                {/* Header */}
                <View style={S.header}>
                    <View>
                        <Text style={S.brand}>Onyx<Text style={S.brandAccent}>OS</Text></Text>
                        <Text style={{ fontSize: 9, color: "#6B7280", marginTop: 4 }}>Sistema de Gestión Freelance</Text>
                    </View>
                    <View style={S.headerRight}>
                        <Text style={S.reciboLabel}>Comprobante de Pago</Text>
                        <Text style={S.reciboNum}>{data.numero}</Text>
                        <Text style={S.fechaText}>{fechaFmt(data.fecha)}</Text>
                    </View>
                </View>

                {/* Monto destacado */}
                <View style={S.montoBox}>
                    <Text style={S.montoLabel}>Monto Pagado</Text>
                    <Text style={S.montoValue}>
                        {new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2 }).format(data.monto)}
                    </Text>
                    <Text style={S.monedaText}>{data.moneda}</Text>
                </View>

                {/* Info del proveedor */}
                <View style={S.section}>
                    <Text style={S.sectionTitle}>Proveedor / Subcontratista</Text>
                    <View style={S.infoBox}>
                        <View style={S.infoRow}>
                            <Text style={S.infoLabel}>Nombre</Text>
                            <Text style={S.infoValue}>{data.proveedor.nombre}</Text>
                        </View>
                        {data.proveedor.empresa ? (
                            <View style={S.infoRow}>
                                <Text style={S.infoLabel}>Empresa</Text>
                                <Text style={S.infoValue}>{data.proveedor.empresa}</Text>
                            </View>
                        ) : null}
                        {data.proveedor.especialidad ? (
                            <View style={S.infoRow}>
                                <Text style={S.infoLabel}>Especialidad</Text>
                                <Text style={S.infoValue}>{data.proveedor.especialidad}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Detalles del pago */}
                <View style={S.section}>
                    <Text style={S.sectionTitle}>Detalles del Pago</Text>
                    <View style={S.infoBox}>
                        <View style={S.infoRow}>
                            <Text style={S.infoLabel}>Fecha de Pago</Text>
                            <Text style={S.infoValue}>{fechaFmt(data.fecha)}</Text>
                        </View>
                        {data.proyecto ? (
                            <View style={S.infoRow}>
                                <Text style={S.infoLabel}>Proyecto</Text>
                                <Text style={S.infoValue}>{data.proyecto}</Text>
                            </View>
                        ) : null}
                        {data.descripcion ? (
                            <View style={S.infoRow}>
                                <Text style={S.infoLabel}>Concepto</Text>
                                <Text style={[S.infoValue, { maxWidth: "60%" }]}>{data.descripcion}</Text>
                            </View>
                        ) : null}
                        {data.cuenta ? (
                            <View style={S.infoRow}>
                                <Text style={S.infoLabel}>Cuenta de Salida</Text>
                                <Text style={S.infoValue}>{data.cuenta}</Text>
                            </View>
                        ) : null}
                        <View style={[S.infoRow, { marginTop: 8, paddingTop: 8, borderTop: "1px solid #1F2937" }]}>
                            <Text style={S.infoLabel}>Total</Text>
                            <Text style={[S.infoValue, { fontSize: 13, color: "#10B981" }]}>
                                {montoFmt(data.monto, data.moneda)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={S.footer}>
                    <Text style={S.footerNote}>
                        Este comprobante es generado automáticamente por OnyxOS.{"\n"}
                        Número de referencia: {data.numero} · {fechaFmt(data.fecha)}
                    </Text>
                    <View style={S.statusBadge}>
                        <Text style={S.statusText}>✓ PAGO REGISTRADO</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

// ── Helper: generar y descargar el PDF ─────────────────────────────────────
export async function descargarReciboPago(data: ProveedorReciboData) {
    const blob = await pdf(<ProveedorReciboPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Recibo-${data.numero}-${data.proveedor.nombre.replace(/\s+/g, "_")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
}

export default ProveedorReciboPDF;

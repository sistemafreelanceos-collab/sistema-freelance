import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { InvoiceData, InvoiceItem } from './invoiceTypes';

export type { InvoiceData, InvoiceItem };

interface Props {
    proyecto: any;
    cliente: any;
    perfil: any;
    invoiceData: InvoiceData;
}

const TIPO_LABEL: Record<string, string> = {
    cotizacion: 'COTIZACIÓN',
    factura: 'FACTURA',
    recibo: 'RECIBO DE PAGO',
};

// ============================================================
// DYNAMIC STYLES (re-created per render with accent color)
// ============================================================
const makeStyles = (accent: string) =>
    StyleSheet.create({
        page: { padding: 44, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica', fontSize: 10, color: '#333' },

        // Header
        header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 20 },
        logoSection: { width: '55%' },
        logoImage: { width: 48, height: 48, borderRadius: 4, marginBottom: 6 },
        logoText: { fontSize: 22, fontWeight: 'bold', color: accent },
        labelSmall: { fontSize: 9, color: '#9CA3AF', marginTop: 2 },
        invoiceInfo: { width: '40%', alignItems: 'flex-end' },
        docTitle: { fontSize: 20, fontWeight: 'bold', color: accent, textTransform: 'uppercase', marginBottom: 6 },
        infoText: { fontSize: 9, color: '#6B7280', marginBottom: 3 },
        numBadge: { backgroundColor: accent, color: '#FFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginTop: 4 },

        // Parties section
        partiesRow: { flexDirection: 'row', gap: 16, marginBottom: 28 },
        partyBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 6, padding: 14, borderLeftWidth: 3, borderLeftColor: accent },
        partyLabel: { fontSize: 8, fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
        partyName: { fontSize: 12, fontWeight: 'bold', color: '#111', marginBottom: 3 },
        partyDetail: { fontSize: 9, color: '#6B7280', marginBottom: 2 },

        // Items table
        table: { marginBottom: 20 },
        tableHeader: { flexDirection: 'row', backgroundColor: accent, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4 },
        tableHeaderText: { color: '#FFF', fontWeight: 'bold', fontSize: 9 },
        tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 9 },
        tableRowAlt: { backgroundColor: '#F9FAFB' },
        colDesc: { flex: 3 },
        colQty: { flex: 1, textAlign: 'center' },
        colPrice: { flex: 1.2, textAlign: 'right' },
        colTotal: { flex: 1.2, textAlign: 'right' },
        cellText: { fontSize: 9, color: '#374151' },
        cellTextBold: { fontSize: 9, fontWeight: 'bold', color: '#111' },

        // Totals
        totalsSection: { alignItems: 'flex-end', marginBottom: 28 },
        totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 3 },
        totalLabel: { fontSize: 9, color: '#6B7280' },
        totalValue: { fontSize: 9, color: '#374151' },
        grandRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', borderTopWidth: 1.5, borderTopColor: accent, paddingTop: 6, marginTop: 4 },
        grandLabel: { fontSize: 12, fontWeight: 'bold', color: accent },
        grandValue: { fontSize: 12, fontWeight: 'bold', color: accent },

        // Notes
        notesBox: { backgroundColor: '#F9FAFB', borderRadius: 6, padding: 12, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: '#E5E7EB' },
        notesLabel: { fontSize: 8, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
        notesText: { fontSize: 9, color: '#6B7280', lineHeight: 1.5 },

        // Footer
        footer: { position: 'absolute', bottom: 28, left: 44, right: 44, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
        footerText: { fontSize: 8, color: '#9CA3AF' },
        footerAccent: { fontSize: 8, color: accent, fontWeight: 'bold' },
    });

// ============================================================
// COMPONENT
// ============================================================
export default function InvoicePDF({ proyecto, cliente, perfil, invoiceData }: Props) {
    const styles = makeStyles(invoiceData.accentColor || '#10B981');
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const moneda = invoiceData.items[0]?.moneda || proyecto?.moneda || 'USD';

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: moneda, maximumFractionDigits: 2 }).format(n);

    const subtotal = invoiceData.items.reduce((s, i) => s + i.cantidad * i.precioUnit, 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {perfil?.avatar_url
                            ? <Image src={perfil.avatar_url} style={styles.logoImage} />
                            : null}
                        <Text style={styles.logoText}>{perfil?.empresa || perfil?.nombre || 'Mi Empresa'}</Text>
                        {perfil?.email && <Text style={styles.labelSmall}>{perfil.email}</Text>}
                        {perfil?.telefono && <Text style={styles.labelSmall}>{perfil.telefono}</Text>}
                        {invoiceData.emisorNit && <Text style={styles.labelSmall}>NIT/RUC: {invoiceData.emisorNit}</Text>}
                    </View>
                    <View style={styles.invoiceInfo}>
                        <Text style={styles.docTitle}>{TIPO_LABEL[invoiceData.tipoDocumento]}</Text>
                        <Text style={styles.infoText}>Fecha: {fecha}</Text>
                        <Text style={styles.infoText}>Validez: 15 días</Text>
                        <Text style={styles.numBadge}>{invoiceData.numeroDocumento}</Text>
                    </View>
                </View>

                {/* ── PARTIES ── */}
                <View style={styles.partiesRow}>
                    <View style={styles.partyBox}>
                        <Text style={styles.partyLabel}>Emitido por</Text>
                        <Text style={styles.partyName}>{perfil?.empresa || perfil?.nombre}</Text>
                        <Text style={styles.partyDetail}>{perfil?.email}</Text>
                        {perfil?.telefono && <Text style={styles.partyDetail}>{perfil.telefono}</Text>}
                        {invoiceData.emisorNit && <Text style={styles.partyDetail}>NIT: {invoiceData.emisorNit}</Text>}
                    </View>
                    <View style={styles.partyBox}>
                        <Text style={styles.partyLabel}>Preparado para</Text>
                        <Text style={styles.partyName}>{cliente?.nombre}</Text>
                        {cliente?.empresa && <Text style={styles.partyDetail}>{cliente.empresa}</Text>}
                        <Text style={styles.partyDetail}>{cliente?.email}</Text>
                        {invoiceData.receptorNit && <Text style={styles.partyDetail}>NIT: {invoiceData.receptorNit}</Text>}
                    </View>
                </View>

                {/* ── ITEMS TABLE ── */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.colDesc]}>Descripción</Text>
                        <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
                        <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio Unit.</Text>
                        <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                    </View>
                    {invoiceData.items.map((item, idx) => (
                        <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                            <View style={styles.colDesc}>
                                <Text style={styles.cellTextBold}>{item.descripcion}</Text>
                            </View>
                            <Text style={[styles.cellText, styles.colQty]}>{item.cantidad}</Text>
                            <Text style={[styles.cellText, styles.colPrice]}>{fmt(item.precioUnit)}</Text>
                            <Text style={[styles.cellTextBold, styles.colTotal]}>{fmt(item.cantidad * item.precioUnit)}</Text>
                        </View>
                    ))}
                </View>

                {/* ── TOTALS ── */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
                    </View>
                    <View style={styles.grandRow}>
                        <Text style={styles.grandLabel}>TOTAL:</Text>
                        <Text style={styles.grandValue}>{fmt(subtotal)}</Text>
                    </View>
                </View>

                {/* ── NOTES ── */}
                {invoiceData.notas ? (
                    <View style={styles.notesBox}>
                        <Text style={styles.notesLabel}>Notas y Condiciones</Text>
                        <Text style={styles.notesText}>{invoiceData.notas}</Text>
                    </View>
                ) : null}

                {/* ── FOOTER ── */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Generado con Onyx Dashboard</Text>
                    <Text style={styles.footerAccent}>{invoiceData.numeroDocumento}</Text>
                </View>

            </Page>
        </Document>
    );
}

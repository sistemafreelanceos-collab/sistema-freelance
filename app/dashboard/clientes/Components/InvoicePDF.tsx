import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Estilos del PDF (parecido a CSS pero para documentos)
const styles = StyleSheet.create({
    page: { padding: 40, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 20 },
    logoSection: { width: '50%' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: '#10B981' }, // Color Esmeralda
    invoiceInfo: { width: '40%', textAlign: 'right' },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', color: '#333' },
    text: { fontSize: 10, color: '#666', marginBottom: 4 },

    // Sección Cliente
    clientSection: { marginBottom: 30, padding: 15, backgroundColor: '#F9FAFB', borderRadius: 4 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#333', marginBottom: 8, textTransform: 'uppercase' },

    // Tabla
    table: { marginTop: 20 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#10B981', padding: 8, borderRadius: 4 },
    tableHeaderItem: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', padding: 10 },

    col1: { width: '60%' },
    col2: { width: '40%', textAlign: 'right' },

    // Totales
    totalSection: { marginTop: 30, alignItems: 'flex-end' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '40%', marginBottom: 5 },
    totalLabel: { fontSize: 10, color: '#666' },
    totalValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 20 },
    footerText: { fontSize: 8, color: '#999' }
});

interface Props {
    proyecto: any;
    cliente: any;
    perfil: any; // Tus datos (Empresa, Nombre, etc)
}

export default function InvoicePDF({ proyecto, cliente, perfil }: Props) {
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const monto = new Intl.NumberFormat('en-US', { style: 'currency', currency: proyecto.moneda || 'USD' }).format(proyecto.monto);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Encabezado */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {/* Si tuvieras logo url: <Image src={perfil.branding_logo_url} style={{ width: 50, height: 50 }} /> */}
                        <Text style={styles.logoText}>{perfil?.empresa || perfil?.nombre || 'ONYX'}</Text>
                        <Text style={styles.text}>{perfil?.email}</Text>
                        {perfil?.telefono && <Text style={styles.text}>{perfil.telefono}</Text>}
                    </View>
                    <View style={styles.invoiceInfo}>
                        <Text style={styles.title}>Cotización</Text>
                        <Text style={styles.text}>Fecha: {fecha}</Text>
                        <Text style={styles.text}>Validez: 15 días</Text>
                    </View>
                </View>

                {/* Datos del Cliente */}
                <View style={styles.clientSection}>
                    <Text style={styles.sectionTitle}>Preparado para:</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{cliente.nombre}</Text>
                    {cliente.empresa && <Text style={styles.text}>{cliente.empresa}</Text>}
                    <Text style={styles.text}>{cliente.email}</Text>
                </View>

                {/* Tabla de Servicios */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderItem, styles.col1]}>Descripción del Proyecto</Text>
                        <Text style={[styles.tableHeaderItem, styles.col2]}>Importe</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={styles.col1}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333' }}>{proyecto.nombre}</Text>
                            <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                                {proyecto.descripcion || "Servicios profesionales de desarrollo y gestión."}
                            </Text>
                        </View>
                        <Text style={[styles.col2, { fontSize: 11, color: '#333' }]}>{monto}</Text>
                    </View>
                </View>

                {/* Totales */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={{ fontSize: 11 }}>{monto}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 5 }]}>
                        <Text style={[styles.totalLabel, { fontSize: 12, fontWeight: 'bold', color: '#10B981' }]}>TOTAL A PAGAR:</Text>
                        <Text style={[styles.totalValue, { color: '#10B981' }]}>{monto}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Generado con Onyx Dashboard - Gracias por su confianza.</Text>
                </View>

            </Page>
        </Document>
    );
}

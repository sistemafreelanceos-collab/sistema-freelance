// Shared invoice data interfaces — kept in a separate file
// so components can import these types WITHOUT importing from
// @react-pdf/renderer (which is ESM-only and must be lazy-loaded).

export interface InvoiceItem {
    descripcion: string;
    cantidad: number;
    precioUnit: number;
    moneda: string;
}

export interface InvoiceData {
    tipoDocumento: 'cotizacion' | 'factura' | 'recibo';
    numeroDocumento: string;  // e.g. "FAC-0042"
    accentColor: string;      // hex color (e.g. "#10B981")
    items: InvoiceItem[];
    notas: string;
    emisorNit?: string;
    receptorNit?: string;
}

import { useState, useEffect } from 'react';

const CACHE_KEY = 'onyx_exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

interface ExchangeRates {
    [currency: string]: number;
}

interface CacheData {
    timestamp: number;
    base: string;
    rates: ExchangeRates;
}

export function useExchangeRate(baseCurrency: string = 'USD') {
    const [rates, setRates] = useState<ExchangeRates | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                // 1. Revisar Caché Local
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsedCache: CacheData = JSON.parse(cached);
                    const now = Date.now();

                    if (parsedCache.base === baseCurrency && (now - parsedCache.timestamp) < CACHE_DURATION) {
                        setRates(parsedCache.rates);
                        setLoading(false);
                        return; // Usamos caché, no hacemos petición
                    }
                }

                // 2. Si no hay caché válido, consultar API
                // Usamos ExchangeRate-API (gratuita, sin key para pares básicos, base USD por defecto)
                const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);

                if (!response.ok) {
                    throw new Error('No se pudo obtener la tasa de cambio');
                }

                const data = await response.json();

                if (data.result === 'success') {
                    setRates(data.rates);

                    // 3. Guardar en Caché
                    const newCache: CacheData = {
                        timestamp: Date.now(),
                        base: baseCurrency,
                        rates: data.rates
                    };
                    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
                } else {
                    throw new Error('Respuesta inválida de la API de divisas');
                }

            } catch (err: any) {
                console.error("Error fetching exchange rates:", err);
                setError(err.message || 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
    }, [baseCurrency]);

    // Función auxiliar para convertir monto
    const convert = (amount: number, toCurrency: string): number | null => {
        if (!rates || !rates[toCurrency]) return null;
        return amount * rates[toCurrency];
    };

    return { rates, loading, error, convert };
}

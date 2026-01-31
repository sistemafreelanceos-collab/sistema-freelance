const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load .env from project root
try {
    const envPath = 'c:/Users/omarm/OneDrive/Documentos/proyectos/sistema-freelance/.env';
    if (fs.existsSync(envPath)) {
        const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (e) {
    console.log("Could not load .env file directly.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) or Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) not found in environment.");
    console.log("Please ensure .env file exists or variables are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log("--- WORKSPACES ---");
    const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('id, name');
    if (wsError) console.error(wsError);
    else console.table(workspaces);

    console.log("\n--- VISIBILIDAD DE DATOS (MOVIMIENTOS) ---");
    const { data: movs, error: movError } = await supabase.from('movimientos').select('id, workspace_id, tipo, monto');

    if (movError) {
        console.error(movError);
    } else {
        const stats = {};

        movs.forEach(m => {
            const wsId = m.workspace_id || 'HUERFANO (NULL)';
            // Try to map ID to Name
            const wsName = workspaces?.find(w => w.id === wsId)?.name || wsId;

            if (!stats[wsName]) stats[wsName] = { count: 0, ingresos: 0, egresos: 0 };
            stats[wsName].count++;
            if (m.tipo === 'ingreso') stats[wsName].ingresos += m.monto;
            else stats[wsName].egresos += m.monto;
        });

        console.table(stats);
    }
}

runAudit();

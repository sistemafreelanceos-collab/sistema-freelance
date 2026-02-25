import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const { data, error } = await supabase.rpc('query', {
        query_text: 'ALTER TABLE public.gastos_fijos ADD COLUMN IF NOT EXISTS fecha_inicio DATE;'
    });
    if (error) {
        console.error("Migration error:", error);
    } else {
        console.log("Migration success:", data);
    }
}

main();

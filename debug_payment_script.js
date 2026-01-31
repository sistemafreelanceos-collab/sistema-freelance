const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function run() {
    try {
        const envPath = path.resolve('.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const [key, ...obj] = line.split('=');
            if (key && obj) {
                envVars[key.trim()] = obj.join('=').trim().replace(/"/g, '');
            }
        });

        const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY; // Try to use service key if available for fuller access

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing credentials in .env.local");
            return;
        }

        const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

        const movementId = '74708f04-852d-4c35-b899-239da6d02ba8';
        const ownerId = 'b24d9a3b-8adb-4f19-9c4a-95091a5256b2';

        console.log("Checking movement:", movementId);
        const { data: move, error: moveError } = await supabase
            .from('movimientos')
            .select('id, workspace_id, monto, tipo')
            .eq('id', movementId);

        if (moveError) console.error("Error fetching movement:", moveError);
        else console.log("Movement:", move);

        console.log("Checking workspace for owner:", ownerId);
        const { data: w, error: wError } = await supabase
            .from('workspaces')
            .select('id, owner_id, name')
            .eq('owner_id', ownerId);

        if (wError) console.error("Error fetching workspace:", wError);
        else console.log("Workspaces:", w);

        // If movement exists and workspace exists but link is missing, try to fix it right here
        if (move && move.length > 0 && !move[0].workspace_id && w && w.length > 0) {
            console.log("Attempting fix from script...");
            const { error: updateError } = await supabase
                .from('movimientos')
                .update({ workspace_id: w[0].id })
                .eq('id', movementId);

            if (updateError) console.error("Update failed:", updateError);
            else console.log("Update SUCCESSFUL from script.");
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

run();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- TASKS ---');
    const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*');
    if (tasksError) console.error(tasksError);
    else console.table(tasks);

    console.log('\n--- SERVICES ---');
    const { data: services, error: servicesError } = await supabase.from('services').select('id, name, default_hourly_rate');
    if (servicesError) console.error(servicesError);
    else console.table(services);

    console.log('\n--- PROFILES ---');
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, full_name, role');
    if (profilesError) console.error(profilesError);
    else console.table(profiles);
}

checkData();

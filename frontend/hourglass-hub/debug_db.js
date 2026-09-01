
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://catawhkrfbldkmzpxrkg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdGF3aGtyZmJsZGttenB4cmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQ1NDAsImV4cCI6MjA4NDUzMDU0MH0.ATrxs7v427Hvd6r_E2GPsY9VtheNbT_2hH01-Zof99k";

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

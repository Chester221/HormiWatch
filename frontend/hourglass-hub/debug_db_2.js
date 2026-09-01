
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://catawhkrfbldkmzpxrkg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdGF3aGtyZmJsZGttenB4cmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQ1NDAsImV4cCI6MjA4NDUzMDU0MH0.ATrxs7v427Hvd6r_E2GPsY9VtheNbT_2hH01-Zof99k";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- PROJECTS ---');
    const { data: projects, error: projectsError } = await supabase.from('projects').select('id, name');
    if (projectsError) console.error(projectsError);
    else console.table(projects);

    console.log('\n--- SERVICE CATEGORIES ---');
    const { data: categories, error: catsError } = await supabase.from('service_categories').select('*');
    if (catsError) console.error(catsError);
    else console.table(categories);
}

checkData();

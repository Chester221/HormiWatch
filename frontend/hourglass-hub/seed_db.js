
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://catawhkrfbldkmzpxrkg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdGF3aGtyZmJsZGttenB4cmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQ1NDAsImV4cCI6MjA4NDUzMDU0MH0.ATrxs7v427Hvd6r_E2GPsY9VtheNbT_2hH01-Zof99k";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding...');

    // 1. Create Service Category
    const { data: cat, error: catError } = await supabase.from('service_categories').insert({
        name: 'Desarrollo',
        description: 'Servicios de desarrollo de software'
    }).select().single();

    if (catError) { console.error('Cat Error:', catError); return; }
    console.log('Category created:', cat.id);

    // 2. Create Service
    const { data: service, error: servError } = await supabase.from('services').insert({
        category_id: cat.id,
        name: 'Desarrollo Backend',
        description: 'API y Base de datos',
        default_hourly_rate: 50,
        is_active: true
    }).select().single();

    if (servError) { console.error('Service Error:', servError); return; }
    console.log('Service created:', service.id);

    // 3. Create Profile (Technician)
    // Need a valid UUID. Using a random one might fail generic auth constraints if referencing auth.users?
    // Profiles usually references auth.users.
    // I cannot insert into profiles if it references auth.users which I can't write to easily as anon/service_role without admin key.
    // BUT the user passed ANON KEY. I probably can't insert into profiles directly if RLS or FK exists.
    // Profiles Usually has: id references auth.users.id

    // Let's try to fetch an existing user from auth? I can't with anon key usually.

    // SKIP Create Profile. The user probably has a logged in user?
    // But my debug script showed profiles EMPTY.
    // If profiles is empty, there are no users.

    // If I can't create a profile, I can't assign a technician.
    // But I CAN create a Project without a leader?
    // Schema: lead_id: string | null.

    // 4. Create Project
    const { data: project, error: projError } = await supabase.from('projects').insert({
        name: 'Proyecto de Prueba',
        description: 'Proyecto generado por el sistema',
        status: 'In Progress',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
        budget: 1000,
        // lead_id: null
    }).select().single();

    if (projError) { console.error('Project Error:', projError); }
    else console.log('Project created:', project.id);

}

seed();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://catawhkrfbldkmzpxrkg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdGF3aGtyZmJsZGttenB4cmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQ1NDAsImV4cCI6MjA4NDUzMDU0MH0.ATrxs7v427Hvd6r_E2GPsY9VtheNbT_2hH01-Zof99k";
const userToken = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImY0NTZkOWZhLTQzMGUtNDQ3NC05NWI4LWRkZWFkNzBlZjE1ZiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2NhdGF3aGtyZmJsZGttenB4cmtnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiYjgwZGQxNy0zNWU1LTQyOTAtYWFhNS01Y2I2MWNmMmY2ZTUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY4OTc0NTg3LCJpYXQiOjE3Njg5NzA5ODcsImVtYWlsIjoicmljaGFyZGFlbDE0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJyaWNoYXJkYWVsMTRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlJpY2hhcmQgRWNoZW5pcXVlIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiYjgwZGQxNy0zNWU1LTQyOTAtYWFhNS01Y2I2MWNmMmY2ZTUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2ODk3MDk4N31dLCJzZXNzaW9uX2lkIjoiODIxMjU0MGItMGM3Yy00MTczLWI2ZDItNDhlNWFmNTMwM2YwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.zhi9sdoi5H5NbYJF_gPbH6974eCo17igYLIWPR_aH0066KYn24To3yiqPL8ZyHtkNjQ_dms8ln2U5vHeYSQABw";

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
    },
});

async function debug() {
    const userId = "bb80dd17-35e5-4290-aaa5-5cb61cf2f6e5";
    console.log(`Checking profile for user: ${userId}`);

    // 1. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.log('Profile Fetch Error:', profileError);
        if (profileError.code === 'PGRST116') {
            console.log('Profile does NOT exist. Attempting creation...');

            const newProfile = {
                id: userId,
                email: "galletasdechocolates666@gmail.com",
                full_name: "Gregorio Hidalgo",
                role: 'Manager',
                updated_at: new Date().toISOString(),
            };

            const { data: created, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

            if (createError) {
                console.error('CRITICAL: Profile Creation FAILED:', createError);
            } else {
                console.log('Profile Created Successfully:', created);
            }
        }
    } else {
        console.log('Profile Exists:', profile);
    }

    // 2. Try to List Tasks (to check basic read access)
    console.log('\nChecking Read Access to Tasks...');
    const { data: tasks, error: taskError } = await supabase.from('tasks').select('id').limit(1);
    if (taskError) console.error('Tasks Read Error:', taskError);
    else console.log('Tasks Read Success, count:', tasks.length);

    // 3. Try to Create a Task (Mock data)
    console.log('\nAttempting to Create Task...');
    // Need a valid service ID first?
    const { data: services } = await supabase.from('services').select('id').limit(1);
    const serviceId = services?.[0]?.id;

    if (!serviceId) {
        console.log("No services found, cannot test task creation fully.");
        return;
    }

    // Need a valid project ID?
    const { data: projects } = await supabase.from('projects').select('id').limit(1);
    const projectId = projects?.[0]?.id;

    if (!projectId) {
        console.log("No projects found, cannot test task creation fully.");
        return;
    }

    const newTask = {
        project_id: projectId,
        service_id: serviceId,
        technician_id: userId,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        description: "Debug Task from Script",
        status: 'Pending',
        priority: 'Medium',
        applied_hourly_rate: 0
    };

    const { data: taskCreated, error: taskCreateError } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

    if (taskCreateError) {
        console.error('CRITICAL: Task Creation FAILED:', taskCreateError);
    } else {
        console.log('Task Created Successfully:', taskCreated);
    }
}

debug();

/**
 * Queen Land LMS - Supabase Cloud Configuration & Connection Layer
 * (CVKD Sync Architecture)
 */

const SUPABASE_URL = 'https://kjufpuzzsnabllffogzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdWZwdXp6c25hYmxsZmZvZ3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMTcyODIsImV4cCI6MjEwNTg5MzI4Mn0.kR-tk-NBRAuZEHrL6IhH-NNsPbNkWGHhsSu7VLg_g_o';

let supabaseClient = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn('[CVKD Sync] Could not initialize Supabase SDK:', e);
}

// Make globally accessible
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabaseClient;

/**
 * Ping Supabase Cloud database to check connection health and update UI indicators
 */
async function checkSupabaseConnection() {
    const badge = document.getElementById('supabase-status-badge');
    const footerStatus = document.getElementById('footer-sync-status');

    if (!supabaseClient) {
        if (badge) {
            badge.className = 'status-badge offline';
            badge.innerHTML = '<i class="bi bi-cloud-slash"></i> CVKD Sync (Ngoại Tuyến)';
        }
        return false;
    }

    try {
        const { error } = await supabaseClient.from('users').select('emp_id').limit(1);
        if (error) throw error;

        if (badge) {
            badge.className = 'status-badge success';
            badge.innerHTML = '<i class="bi bi-cloud-check-fill"></i> CVKD Sync (Đã Kết Nối)';
        }
        if (footerStatus) {
            footerStatus.innerHTML = '<span style="color:#10b981;">&bull; Online (CVKD Sync)</span>';
        }
        return true;
    } catch (err) {
        console.warn('[CVKD Sync] Cloud ping notification:', err.message);
        if (badge) {
            badge.className = 'status-badge warning';
            badge.innerHTML = '<i class="bi bi-cloud-slash"></i> CVKD Sync (Chế độ Local)';
        }
        return false;
    }
}

window.checkSupabaseConnection = checkSupabaseConnection;

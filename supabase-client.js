/**
 * supabase-client.js
 * Configuración y cliente oficial de Supabase para Gestor de Autos
 */

const SUPABASE_URL = 'https://evicohbaegbdtbifmzjs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2aWNvaGJhZWdiZHRiaWZtempzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjU5OTMsImV4cCI6MjA4NDk0MTk5M30.N7nXyCkMX_cs_SMbaTYDkTCX-F16JoJwZjefKTHxBPY';

let supabaseClient = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (err) {
    console.error('Error al inicializar cliente de Supabase:', err);
}

window.gaSupabase = {
    client: supabaseClient,
    url: SUPABASE_URL,
    
    // Iniciar Sesión con Correo y Contraseña
    async login(email, password) {
        if (!this.client && window.supabase) {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        if (!this.client) {
            return { data: { user: { email } }, error: null };
        }
        return await this.client.auth.signInWithPassword({
            email: email,
            password: password
        });
    },

    // Registrar nuevo usuario
    async signUp(email, password) {
        if (!this.client && window.supabase) {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        if (!this.client) {
            throw new Error('Supabase no está disponible');
        }
        return await this.client.auth.signUp({
            email: email,
            password: password
        });
    },

    // Obtener sesión activa
    async getSession() {
        if (!this.client && window.supabase) {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        if (this.client) {
            const { data } = await this.client.auth.getSession();
            return data?.session || null;
        }
        return JSON.parse(localStorage.getItem('ga_active_session') || 'null');
    },

    // Cerrar sesión
    async logout() {
        if (this.client) {
            try {
                await this.client.auth.signOut();
            } catch (e) {
                console.warn(e);
            }
        }
        localStorage.removeItem('ga_active_session');
        sessionStorage.removeItem('ga_active_session');
    }
};

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// La app usa el backend custom (NestJS) para la autenticación.
// Supabase se mantiene disponible de forma opcional; si no hay credenciales
// configuradas, no se lanza un error al importar (módulo inerte).
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

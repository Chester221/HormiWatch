import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export type UserRole = 'Technician' | 'Manager' | 'Admin'

export interface UserProfile {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string | null
    role: UserRole
    dark_mode: boolean
    preferences?: {
        tasks_view?: "list" | "calendar"
        projects_view?: "grid" | "table"
        tasks_filters?: {
            project?: string
            status?: string
        }
    }
    email_notifications?: boolean
    task_reminders?: boolean
    weekly_summary?: boolean
    created_at?: string
    updated_at?: string
}

interface AuthContextType {
    user: User | null
    session: Session | null
    profile: UserProfile | null
    loading: boolean
    isManager: boolean
    isCreatingUser: boolean
    error: string | null
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<Pick<UserProfile, 'full_name' | 'avatar_url' | 'dark_mode'>>) => Promise<{ error: Error | null }>
    uploadAvatar: (file: File) => Promise<{ url: string | null; error: Error | null }>
    refreshProfile: () => Promise<void>
    setCreatingUser: (value: boolean) => void
    updatePreferences: (preferences: any) => Promise<void>
    getPreference: <T>(key: string, defaultValue: T) => T
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState<string | null>(null)
    const [isCreatingUser, setIsCreatingUser] = useState(false)

    const isManager = profile?.role === 'Manager' || profile?.role === 'Admin'

    const getPreference = useCallback(<T,>(key: string, defaultValue: T): T => {
        if (!profile?.preferences) return defaultValue
        const value = (profile.preferences as any)[key]
        return value !== undefined ? value : defaultValue
    }, [profile])

    const updatePreferences = useCallback(async (preferences: any) => {
        if (!user) throw new Error('No hay usuario autenticado')
        
        try {
            const currentPrefs = profile?.preferences || {}
            const updatedPrefs = {
                ...currentPrefs,
                ...preferences
            }
            
            const updateData: any = {
                preferences: updatedPrefs,
                updated_at: new Date().toISOString()
            }
            
            if (preferences.dark_mode !== undefined) {
                updateData.dark_mode = preferences.dark_mode
            }
            
            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id)
            
            if (error) throw error
            
            setProfile(prev => prev ? { 
                ...prev, 
                ...(preferences.dark_mode !== undefined ? { dark_mode: preferences.dark_mode } : {}),
                preferences: updatedPrefs 
            } : null)
            
            if (preferences.dark_mode !== undefined) {
                if (preferences.dark_mode) {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            }
        } catch (err) {
            console.error('Error actualizando preferencias:', err)
            throw err
        }
    }, [user, profile])

    const fetchProfile = useCallback(async (userId: string, userData?: User): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                if (error.code === 'PGRST116' && userData) {
                    console.log('Perfil no encontrado, creando uno nuevo...');
                    const newProfile = {
                        id: userId,
                        email: userData.email,
                        full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0],
                        avatar_url: userData.user_metadata?.avatar_url,
                        role: 'Technician' as UserRole,
                        dark_mode: false,
                        preferences: {
                            tasks_view: 'list',
                            projects_view: 'grid',
                        },
                        is_active: true,
                        updated_at: new Date().toISOString(),
                    };

                    const { data: createdProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert(newProfile)
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error FATAL creando perfil automático:', createError);
                        throw new Error(`No se pudo crear tu perfil: ${createError.message}`);
                    }

                    return createdProfile as UserProfile;
                }
                throw error;
            }

            return data as UserProfile
        } catch (err: any) {
            console.error('Error crítico en fetchProfile:', err)
            throw err;
        }
    }, [])

    const initializeAuth = useCallback(async () => {
        try {
            setLoading(true);
            setAuthError(null);
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
                try {
                    const profileData = await fetchProfile(currentSession.user.id, currentSession.user);
                    setProfile(profileData);
                    
                    if (profileData?.dark_mode) {
                        document.documentElement.classList.add('dark')
                    } else {
                        document.documentElement.classList.remove('dark')
                    }
                } catch (profileErr: any) {
                    console.error("Fallo carga de perfil, bloqueando acceso");
                    setAuthError(`Error cargando tu perfil: ${profileErr.message || 'Error desconocido'}`);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }
        } catch (err: any) {
            console.error('Error inicializando auth:', err);
            setAuthError(`Error de conexión: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [fetchProfile]);

    useEffect(() => {
        initializeAuth();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log("Auth Event:", event);
            
            if (isCreatingUser) {
                console.log('⏳ Creando usuario, ignorando SIGNED_IN');
                return;
            }
            
            if (event === 'SIGNED_OUT') {
                setSession(null); setUser(null); setProfile(null); setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                initializeAuth();
            }
        });
        return () => { subscription.unsubscribe(); };
    }, [initializeAuth, isCreatingUser]);

    const signIn = async (email: string, password: string) => {
        if (!email || !password) {
            return { error: { message: 'Completa todos los campos' } as AuthError };
        }
        if (!email.includes('@') || !email.includes('.')) {
            return { error: { message: 'Formato de email inválido' } as AuthError };
        }
        const cleanEmail = email.toLowerCase().trim();
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                return { error: { message: 'Email o contraseña incorrectos' } as AuthError };
            }
            if (error.message.includes('Email not confirmed')) {
                return { error: { message: 'Debes confirmar tu email antes de iniciar sesión' } as AuthError };
            }
        }
        return { error };
    }

    const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
        if (!email || !email.includes('@') || !email.includes('.')) {
            return { error: { message: 'Formato de email inválido' } as AuthError };
        }
        if (!password || password.length < 6) {
            return { error: { message: 'La contraseña debe tener al menos 6 caracteres' } as AuthError };
        }
        
        const cleanEmail = email.toLowerCase().trim();
        setIsCreatingUser(true);
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: { data: { full_name: metadata?.full_name?.trim() || cleanEmail.split('@')[0] } },
            });
            
            if (error) {
                if (error.message.includes('already registered')) {
                    return { error: { message: 'Este email ya está registrado. Inicia sesión.' } as AuthError };
                }
                if (error.status === 429) {
                    return { error: { message: 'Demasiados intentos. Espera un minuto.' } as AuthError };
                }
                return { error: { message: 'Error al crear la cuenta. Intenta de nuevo.' } as AuthError };
            }
            
            if (data?.user) {
                const { error: profileError } = await supabase.from('profiles').insert({
                    id: data.user.id,
                    email: cleanEmail,
                    full_name: metadata?.full_name?.trim() || cleanEmail.split('@')[0],
                    role: 'Technician',
                    dark_mode: false,
                    preferences: {
                        tasks_view: 'list',
                        projects_view: 'grid',
                    },
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
                
                if (profileError) {
                    console.error('Error creando perfil:', profileError);
                }
            }
            
            return { error: null };
        } finally {
            setIsCreatingUser(false);
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setProfile(null); setUser(null); setSession(null)
        localStorage.removeItem('id_usuario'); localStorage.removeItem('nombre_usuario'); localStorage.removeItem('authToken')
    }

    const updateProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'avatar_url' | 'dark_mode'>>) => {
        if (!user) return { error: new Error('No hay usuario autenticado') }
        try {
            const result = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', user.id)
            if (result.error) console.warn('Error updating profile:', result.error.message)
            setProfile(prev => prev ? { ...prev, ...updates } : null)
            return { error: null }
        } catch (err) {
            setProfile(prev => prev ? { ...prev, ...updates } : null)
            return { error: null }
        }
    }

    const uploadAvatar = async (file: File): Promise<{ url: string | null; error: Error | null }> => {
        if (!user) return { url: null, error: new Error('No hay usuario autenticado') }
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) return { url: null, error: new Error('Almacenamiento no configurado.') }
                return { url: null, error: new Error(uploadError.message) }
            }
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
            await updateProfile({ avatar_url: publicUrl })
            return { url: publicUrl, error: null }
        } catch (err) {
            return { url: null, error: err as Error }
        }
    }

    const value = { 
        user, 
        session, 
        profile, 
        loading, 
        isManager, 
        isCreatingUser,
        error: authError, 
        signIn, 
        signUp, 
        signOut, 
        updateProfile, 
        uploadAvatar, 
        refreshProfile: initializeAuth,
        setCreatingUser: setIsCreatingUser,
        updatePreferences,
        getPreference,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
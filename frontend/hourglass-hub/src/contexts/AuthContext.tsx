import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { usersApi, authApi, setAccessToken, requestRefresh } from '@/lib/api'

export type UserRole = 'Technician' | 'Manager' | 'Admin' | 'Leader'

export interface UserProfile {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string | null
    role: UserRole
    dark_mode: boolean
    preferences?: {
        tasks_view?: "list" | "calendar"
        projects_view?: "grid" | "list" | "compact"
        tasks_filters?: {
            project?: string
            status?: string
        }
        dark_mode?: boolean
    }
    email_notifications?: boolean
    task_reminders?: boolean
    weekly_summary?: boolean
    created_at?: string
    updated_at?: string
}

interface AuthContextType {
    user: any | null
    session: any | null
    profile: UserProfile | null
    loading: boolean
    isManager: boolean
    isCreatingUser: boolean
    error: string | null
    signIn: (email: string, password: string) => Promise<{ error: any | null }>
    signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: any | null }>
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
    const [user, setUser] = useState<any | null>(null)
    const [session, setSession] = useState<any | null>(null)
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
        
        const currentPrefs = profile?.preferences || {}
        const updatedPrefs = {
            ...currentPrefs,
            ...preferences
        }

        // 💨 CAMBIO INSTANTÁNEO (optimista): actualizar UI antes de esperar la API
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

        try {
            await usersApi.update(user.id, { preferences: updatedPrefs })
        } catch (err) {
            // Revertir si el servidor falló
            setProfile(prev => prev ? {
                ...prev,
                ...(preferences.dark_mode !== undefined ? { dark_mode: currentPrefs.dark_mode ?? false } : {}),
                preferences: currentPrefs
            } : null)
            if (preferences.dark_mode !== undefined) {
                if (preferences.dark_mode) {
                    document.documentElement.classList.remove('dark')
                } else {
                    document.documentElement.classList.add('dark')
                }
            }
            console.error('Error actualizando preferencias:', err)
            throw err
        }
    }, [user, profile])

    const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        try {
            const data = await usersApi.getById(userId);
            // ✅ NORMALIZAR la respuesta del backend: UserResponseDto devuelve el
            // perfil ANIDADO en data.profile (name/lastName/full_name/avatar_url),
            // pero la app consume UserProfile PLANO. Aplanar aquí para que
            // profile.full_name / profile.avatar_url existan en todo el frontend.
            const p = data?.profile ?? {};
            const role: UserRole =
                typeof data.role === 'string'
                    ? (data.role as UserRole)
                    : (data.role?.name as UserRole) || 'Technician';
            const preferences = data.preferences ?? {};
            return {
                id: data.id,
                full_name:
                    p.full_name ||
                    `${p.name || ''} ${p.lastName || ''}`.trim() ||
                    null,
                avatar_url: p.avatar_url ?? p.profilePicture ?? null,
                email: data.email ?? null,
                role,
                dark_mode: preferences.dark_mode ?? false,
                preferences,
                created_at: data.created_at ?? data.createdAt ?? p.createdAt,
                updated_at: data.updated_at ?? data.updatedAt ?? p.updatedAt,
            } as UserProfile;
        } catch (err: any) {
            console.error('Error crítico en fetchProfile:', err)
            throw err;
        }
    }, [])

    const initializeAuth = useCallback(async () => {
        try {
          setLoading(true);
          setAuthError(null);
          
          // ✅ Usar refresh/session con withCredentials (cookie HttpOnly)
          // Si hay un refresh token en cookie, se renovará automáticamente
          try {
            let sessionData = null;
            try {
              sessionData = await authApi.session();
            } catch {
              // Si el access token no está, el auto-refresh se encarga
              const refreshed = await requestRefresh();
              if (refreshed) {
                sessionData = await authApi.session();
              }
            }
            
            if (sessionData?.id) {
              setUser(sessionData);
              setSession({ user: sessionData });
              
              try {
                const profileData = await fetchProfile(sessionData.id);
                setProfile(profileData);
                
                if (profileData?.dark_mode) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (profileErr: any) {
                console.error("Fallo carga de perfil", profileErr);
                setAuthError(`Error cargando tu perfil: ${profileErr.message || 'Error desconocido'}`);
                setProfile(null);
              }
            } else {
              setUser(null);
              setSession(null);
              setProfile(null);
            }
          } catch (err) {
            console.error('Error en session:', err);
            setUser(null);
            setSession(null);
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
    }, [initializeAuth]);

    const signIn = async (email: string, password: string) => {
        if (!email || !password) {
            return { error: { message: 'Completa todos los campos' } };
        }
        if (!email.includes('@') || !email.includes('.')) {
            return { error: { message: 'Formato de email inválido' } };
        }
        
        try {
            const result = await authApi.login(email, password);
            
            if (result?.error) {
                return { error: result.error };
            }
            
            if (result?.accessToken) {
                setAccessToken(result.accessToken);
            }
            
            if (result?.user) {
                setUser(result.user);
                setSession({ user: result.user });
                
                try {
                    const profileData = await fetchProfile(result.user.id);
                    setProfile(profileData);
                } catch (err) {
                    console.error('Error cargando perfil después de login:', err);
                }
            }
            
            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message || 'Error de conexión' } };
        }
    }

    const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
        if (!email || !email.includes('@') || !email.includes('.')) {
            return { error: { message: 'Formato de email inválido' } };
        }
        if (!password || password.length < 6) {
            return { error: { message: 'La contraseña debe tener al menos 6 caracteres' } };
        }
        
        setIsCreatingUser(true);
        
        try {
            const result = await usersApi.create({
                email,
                password,
                name: metadata?.full_name || email.split('@')[0],
                lastName: "",
                roleId: "4be26163-4d7c-48b6-90ef-9ad31da963a7",
            });
            
            if (result?.error) {
                return { error: result.error };
            }

            // ✅ CORREGIDO (#1): usersApi.create() SOLO crea el registro y NO setea la
            // cookie HttpOnly de sesión → sin ella, TODO /auth/refresh respondía 401
            // justo después de registrarse. Hacemos AUTO-LOGIN para establecer la sesión
            // (cookie + access token) y que el refresh del token funcione.
            const loginResult = await authApi.login(email, password);
            if (loginResult?.accessToken) {
                setAccessToken(loginResult.accessToken);
            }

            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message || 'Error al crear la cuenta' } };
        } finally {
            setIsCreatingUser(false);
        }
    }

    const signOut = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.error('Error en logout:', err);
        }
        localStorage.removeItem('token');
        setAccessToken(null);
        setProfile(null); 
        setUser(null); 
        setSession(null);
    }

    // ✅ CORREGIDO: updateProfile envía full_name correctamente
    const updateProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'avatar_url' | 'dark_mode'>>) => {
        if (!user) return { error: new Error('No hay usuario autenticado') };
        
        try {
            const body: {
                full_name?: string;
                name?: string;
                lastName?: string;
                avatar_url?: string;
                preferences?: UserProfile['preferences'];
            } = {};

            if (updates.dark_mode !== undefined) {
                body.preferences = { ...(profile?.preferences || {}), dark_mode: updates.dark_mode };
            }

            if (updates.avatar_url !== undefined) {
                body.avatar_url = updates.avatar_url;
            }

            if (updates.full_name !== undefined) {
                const fullName = updates.full_name.trim();
                body.full_name = fullName;
                // ✅ Mantener name/lastName sincronizados en el perfil: Team, modales
                // y listas leen esos campos. Primera palabra → name, el resto → lastName.
                const [first, ...rest] = fullName.split(/\s+/);
                body.name = first ?? '';
                body.lastName = rest.join(' ') || '';
            }

            await usersApi.update(user.id, body);
            
            setProfile(prev => prev ? { ...prev, ...updates } : null);
            return { error: null };
        } catch (err) {
            console.error('Error updating profile:', err);
            return { error: err as Error };
        }
    }

    const uploadAvatar = async (file: File): Promise<{ url: string | null; error: Error | null }> => {
        if (!user) return { url: null, error: new Error('No hay usuario autenticado') };
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await fetch(`http://localhost:3000/api/v1/storage/upload`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });
            
            const data = await result.json();
            
            if (data?.url) {
                await updateProfile({ avatar_url: data.url });
                return { url: data.url, error: null };
            }
            
            return { url: null, error: new Error('No se pudo subir el avatar') };
        } catch (err) {
            return { url: null, error: err as Error };
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
/**
 * Supabase Database Types
 * 
 * These types define the structure of the database tables.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            clients: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    company: string | null
                    address: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    email: string | null
                    role: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    role?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    role?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    status: string
                    client_id: string | null
                    lead_id: string | null
                    start_date: string | null
                    end_date: string | null
                    budget: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    status?: string
                    client_id?: string | null
                    lead_id?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    budget?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    status?: string
                    client_id?: string | null
                    lead_id?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    budget?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            service_categories: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                }
            }
            services: {
                Row: {
                    id: string
                    category_id: string
                    name: string
                    description: string | null
                    default_hourly_rate: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    category_id: string
                    name: string
                    description?: string | null
                    default_hourly_rate: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    category_id?: string
                    name?: string
                    description?: string | null
                    default_hourly_rate?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            tasks: {
                Row: {
                    id: number
                    created_at: string
                    updated_at: string
                    project_id: string
                    technician_id: string
                    service_id: string
                    start_time: string
                    end_time: string | null
                    duration_in_minutes: number | null
                    description: string | null
                    status: string
                    priority: string
                    applied_hourly_rate: number
                }
                Insert: {
                    id?: number
                    created_at?: string
                    updated_at?: string
                    project_id: string
                    technician_id: string
                    service_id: string
                    start_time: string
                    end_time?: string | null
                    duration_in_minutes?: number | null
                    description?: string | null
                    status: string
                    priority: string
                    applied_hourly_rate: number
                }
                Update: {
                    id?: number
                    created_at?: string
                    updated_at?: string
                    project_id?: string
                    technician_id?: string
                    service_id?: string
                    start_time?: string
                    end_time?: string | null
                    duration_in_minutes?: number | null
                    description?: string | null
                    status?: string
                    priority?: string
                    applied_hourly_rate?: number
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

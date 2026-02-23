import { supabase } from './supabase';

export interface AuthUser {
    id: string;
    email: string;
    name?: string;
}

export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.name,
    };
}

export function onAuthChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            callback({
                id: session.user.id,
                email: session.user.email ?? '',
                name: session.user.user_metadata?.name,
            });
        } else {
            callback(null);
        }
    });
}

// --- User Preferences (saved markets & alerts) ---

export interface UserPreference {
    id: string;
    region_id: string;
    alerts_enabled: boolean;
    alert_threshold: number | null;
    region_name?: string;
    region_state?: string;
}

export async function getSavedMarkets(userId: string): Promise<UserPreference[]> {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*, regions(name, state)')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching saved markets:', error.message);
        return [];
    }
    return (data ?? []).map((d: any) => ({
        id: d.id,
        region_id: d.region_id,
        alerts_enabled: d.alerts_enabled,
        alert_threshold: d.alert_threshold,
        region_name: d.regions?.name,
        region_state: d.regions?.state,
    }));
}

export async function saveMarket(userId: string, regionId: string) {
    const { error } = await supabase
        .from('user_preferences')
        .upsert(
            { user_id: userId, region_id: regionId, alerts_enabled: false },
            { onConflict: 'user_id,region_id' }
        );
    if (error) throw error;
}

export async function removeSavedMarket(userId: string, regionId: string) {
    const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('region_id', regionId);
    if (error) throw error;
}

export async function toggleAlert(prefId: string, enabled: boolean, threshold?: number) {
    const updates: any = { alerts_enabled: enabled };
    if (threshold !== undefined) updates.alert_threshold = threshold;
    const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('id', prefId);
    if (error) throw error;
}

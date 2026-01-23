import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Walidacja zmiennych środowiskowych
export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey;

// Loguj tylko w development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase config:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ MISSING',
    error: supabaseConfigError,
  });

  if (supabaseConfigError) {
    console.error('❌ BRAK ZMIENNYCH ŚRODOWISKOWYCH SUPABASE!');
  }
}

// Singleton pattern dla klienta Supabase
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': 'turbo-challenge',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseInstance;
}

// Klient dla użytkownika (frontend)
export const supabase = getSupabaseClient();

// Pomocnicze funkcje do obsługi storage
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<{ url: string | null; error: string | null }> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '31536000', // 1 rok cache dla Pro
      upsert: options?.upsert ?? false,
      contentType: file.type,
    });

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: getPublicUrl(bucket, data.path), error: null };
};

// Funkcja do usuwania pliku ze storage
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
};

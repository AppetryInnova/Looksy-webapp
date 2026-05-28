import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

/**
 * Singleton instance of Supabase Client.
 * Automatically configured to interact with your Supabase backend.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Utility function for securely uploading media specifically to the 'looksy-media' bucket.
 * 
 * @param file The file Blob or File object to upload
 * @param path The path/filename inside the bucket
 * @returns The public URL string of the uploaded file or null if an error occurs
 */
export async function uploadLooksyMedia(file: File | Blob, path: string): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from('looksy-media')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true, // Use true if you expect overwrites of same names, otherwise false
            });

        if (error) {
            console.error('Error uploading file to Supabase Looksy Media:', error);
            return null;
        }

        const { data: publicUrlData } = supabase.storage
            .from('looksy-media')
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error('Unhandled error uploading to Supabase:', err);
        return null;
    }
}

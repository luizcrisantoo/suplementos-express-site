'use client';
import { createBrowserClient } from '@supabase/ssr';

/** So a anon key vai para o navegador. RLS decide o que ela enxerga. */
export const supabaseNavegador = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

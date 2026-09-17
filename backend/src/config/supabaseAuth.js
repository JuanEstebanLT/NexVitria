import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Falta la variable SUPABASE_URL en el archivo .env"
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "Falta la variable SUPABASE_PUBLISHABLE_KEY en el archivo .env"
  );
}

const supabaseAuth = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

export default supabaseAuth;
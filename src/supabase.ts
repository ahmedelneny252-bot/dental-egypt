import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://oqcgjikcefnrfjuawrcz.supabase.co";
export const supabaseAnonKey = "sb_publishable_l2xqq54uqeremgU8e83qBw_-mJXOzaj";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
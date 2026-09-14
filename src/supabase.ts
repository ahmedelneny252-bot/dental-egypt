import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oqcgjikcefnrfjuawrcz.supabase.co";
const supabaseAnonKey = "sb_publishable_l2xqq54uqeremgU8e83qBw_-mJXOzaj";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
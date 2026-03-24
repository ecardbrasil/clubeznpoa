export type DataProvider = "local" | "supabase";

const rawProvider = (process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "local").toLowerCase();

export const dataProvider: DataProvider = rawProvider === "supabase" ? "supabase" : "local";

export const isSupabaseMode = dataProvider === "supabase";


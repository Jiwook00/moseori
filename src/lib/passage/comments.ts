import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PassageComment = {
  id: string;
  passage_id: string;
  body: string;
  created_at: string;
};

export async function fetchCommentsByPassage(
  supabase: SupabaseServerClient,
  passageIds: string[],
): Promise<Map<string, PassageComment[]>> {
  const byPassage = new Map<string, PassageComment[]>();
  if (passageIds.length === 0) return byPassage;

  const { data } = await supabase
    .from("passage_comment")
    .select("id, passage_id, body, created_at")
    .in("passage_id", passageIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .returns<PassageComment[]>();

  for (const comment of data ?? []) {
    const list = byPassage.get(comment.passage_id) ?? [];
    list.push(comment);
    byPassage.set(comment.passage_id, list);
  }
  return byPassage;
}

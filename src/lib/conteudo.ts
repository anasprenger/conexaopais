import { supabase } from "@/integrations/supabase/client";

export type TipoInteracao = "curtida" | "salvo" | "lido";
export type TipoPublicacao = "artigo" | "post" | "revista" | "coluna";

export async function resolverAvatar(valor: string | null | undefined): Promise<string | null> {
  if (!valor) return null;
  if (valor.startsWith("http")) return valor;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(valor, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function enviarAvatar(userId: string, arquivo: File): Promise<string> {
  const ext = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const caminho = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
  if (error) throw error;
  return caminho;
}

export async function minhasInteracoes(userId: string) {
  const { data } = await supabase
    .from("interacoes")
    .select("publicacao_slug, tipo, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function alternarInteracao(
  userId: string,
  slug: string,
  tipo: TipoInteracao,
  ativo: boolean,
) {
  if (ativo) {
    await supabase
      .from("interacoes")
      .delete()
      .eq("user_id", userId)
      .eq("publicacao_slug", slug)
      .eq("tipo", tipo);
    return false;
  }
  await supabase.from("interacoes").insert({ user_id: userId, publicacao_slug: slug, tipo });
  return true;
}

export async function marcarLido(userId: string, slug: string) {
  await supabase
    .from("interacoes")
    .insert({ user_id: userId, publicacao_slug: slug, tipo: "lido" })
    .select()
    .maybeSingle();
}

export async function ranking(tipo: TipoInteracao, limite = 5) {
  const { data } = await supabase.rpc("ranking_interacoes", { _tipo: tipo, _limite: limite });
  return data ?? [];
}

export async function rankingComentarios(limite = 5) {
  const { data } = await supabase.rpc("ranking_comentarios", { _limite: limite });
  return data ?? [];
}

export function gerarSlug(titulo: string) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** Envia o PDF de uma edição da revista e devolve o caminho salvo no armazenamento. */
export async function enviarPdfRevista(arquivo: File): Promise<string> {
  const nome = arquivo.name.replace(/[^a-zA-Z0-9.-]+/g, "-").toLowerCase();
  const caminho = `edicoes/${Date.now()}-${nome}`;
  const { error } = await supabase.storage
    .from("revistas")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type || "application/pdf" });
  if (error) throw error;
  return caminho;
}

/** Converte o valor salvo em pdf_url num link utilizável (link externo, arquivo local ou storage). */
export async function resolverPdf(valor: string | null | undefined): Promise<string | null> {
  if (!valor) return null;
  if (valor.startsWith("http") || valor.startsWith("/")) return valor;
  const { data } = await supabase.storage.from("revistas").createSignedUrl(valor, 60 * 60, {
    download: false,
  });
  return data?.signedUrl ?? null;
}

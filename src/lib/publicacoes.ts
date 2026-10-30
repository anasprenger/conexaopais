import { supabase } from "@/integrations/supabase/client";
import { tempoLeitura, type Artigo } from "@/data/mock";

export type PublicacaoDb = {
  id: string;
  tipo: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  categoria: string | null;
  conteudo: string | null;
  pdf_url: string | null;
  status: string;
  autor_id: string;
  created_at: string;
};

function paragrafos(conteudo: string | null): string[] {
  if (!conteudo) return [];
  return conteudo
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function paraArtigo(p: PublicacaoDb, autor: string): Artigo {
  const corpo = paragrafos(p.conteudo);
  return {
    id: p.id,
    autorId: p.autor_id,
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo ?? corpo[0]?.slice(0, 160) ?? "",
    categoria: p.categoria ?? (p.tipo === "post" ? "Post" : "Comunidade"),
    autor,
    data: new Date(p.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    leitura: tempoLeitura(corpo.length ? corpo : [p.resumo ?? p.titulo]),
    conteudo: corpo.length ? corpo : [p.resumo ?? ""],
  };
}

/** Remove uma publicação. Quando é de outra pessoa, registra a justificativa como aviso ao autor. */
export async function excluirPublicacao(dados: {
  id: string;
  slug: string;
  titulo: string;
  tipo: string;
  autorId: string;
  adminId: string;
  justificativa: string;
  avisarAutor: boolean;
}) {
  if (dados.avisarAutor) {
    const { error } = await supabase.from("remocoes_publicacao").insert({
      publicacao_id: dados.id,
      slug: dados.slug,
      titulo: dados.titulo,
      tipo: dados.tipo,
      autor_id: dados.autorId,
      removido_por: dados.adminId,
      justificativa: dados.justificativa,
    });
    if (error) throw error;
  }
  const { error } = await supabase.from("publicacoes").delete().eq("id", dados.id);
  if (error) throw error;
}

export type AvisoRemocao = {
  id: string;
  titulo: string;
  tipo: string;
  justificativa: string;
  created_at: string;
};

/** Avisos de publicações removidas pela administração, para mostrar ao autor. */
export async function meusAvisosRemocao(userId: string): Promise<AvisoRemocao[]> {
  const { data } = await supabase
    .from("remocoes_publicacao")
    .select("id, titulo, tipo, justificativa, created_at")
    .eq("autor_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Colunas publicadas no banco (usadas na listagem de colunas). */
export async function colunasPublicadas(): Promise<PublicacaoDb[]> {
  const { data } = await supabase
    .from("publicacoes")
    .select("*")
    .eq("tipo", "coluna")
    .eq("status", "publicado")
    .order("created_at", { ascending: false });
  return (data ?? []) as PublicacaoDb[];
}

async function nomesDosAutores(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const { data } = await supabase.rpc("public_profiles", { _ids: ids });
  return new Map((data ?? []).map((p) => [p.id, p.display_name ?? "Equipe Conexão Pais"]));
}

/** Artigos e posts publicados pela comunidade profissional, prontos para a listagem. */
export async function artigosPublicados(): Promise<Artigo[]> {
  const { data } = await supabase
    .from("publicacoes")
    .select("*")
    .in("tipo", ["artigo", "post"])
    .eq("status", "publicado")
    .order("created_at", { ascending: false });
  const lista = (data ?? []) as PublicacaoDb[];
  const autores = await nomesDosAutores([...new Set(lista.map((p) => p.autor_id))]);
  return lista.map((p) => paraArtigo(p, autores.get(p.autor_id) ?? "Equipe Conexão Pais"));
}

/** Artigos e posts publicados por quem tem este nome de exibição (perfil público). */
export async function artigosPorNomeAutor(nome: string): Promise<Artigo[]> {
  const { data: perfis } = await supabase.rpc("public_profiles", { _display_name: nome });
  const ids = (perfis ?? []).map((p) => p.id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("publicacoes")
    .select("*")
    .in("autor_id", ids)
    .in("tipo", ["artigo", "post"])
    .eq("status", "publicado")
    .order("created_at", { ascending: false });
  return ((data ?? []) as PublicacaoDb[]).map((p) => paraArtigo(p, nome));
}

export async function artigoPublicadoPorSlug(slug: string): Promise<Artigo | null> {
  const { data } = await supabase
    .from("publicacoes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();
  if (!data) return null;
  const p = data as PublicacaoDb;
  const autores = await nomesDosAutores([p.autor_id]);
  return paraArtigo(p, autores.get(p.autor_id) ?? "Equipe Conexão Pais");
}

export async function publicacoesDoAutor(autorId: string): Promise<PublicacaoDb[]> {
  const { data } = await supabase
    .from("publicacoes")
    .select("*")
    .eq("autor_id", autorId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PublicacaoDb[];
}

export type RevistaDb = {
  id: string;
  autorId: string;
  slug: string;
  titulo: string;
  resumo: string;
  data: string;
  pdf: string | null;
  conteudo: string[];
};

function paraRevista(p: PublicacaoDb): RevistaDb {
  return {
    id: p.id,
    autorId: p.autor_id,
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo ?? "",
    data: new Date(p.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    pdf: p.pdf_url,
    conteudo: paragrafos(p.conteudo),
  };
}

/** Edições da revista publicadas pela administração (com PDF enviado). */
export async function revistasPublicadas(): Promise<RevistaDb[]> {
  const { data } = await supabase
    .from("publicacoes")
    .select("*")
    .eq("tipo", "revista")
    .eq("status", "publicado")
    .order("created_at", { ascending: false });
  return ((data ?? []) as PublicacaoDb[]).map(paraRevista);
}

export async function revistaPublicadaPorSlug(slug: string): Promise<RevistaDb | null> {
  const { data } = await supabase
    .from("publicacoes")
    .select("*")
    .eq("tipo", "revista")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();
  return data ? paraRevista(data as PublicacaoDb) : null;
}

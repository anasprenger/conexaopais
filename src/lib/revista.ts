import { notFound } from "@tanstack/react-router";
import { revistas, type PaginaRevista } from "@/data/mock";
import { revistaPublicadaPorSlug } from "@/lib/publicacoes";

export type Edicao = {
  /** Só existe nas edições publicadas pelo site (no banco); as de exemplo não têm. */
  id: string | null;
  autorId: string | null;
  slug: string;
  etiqueta: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string;
  destaques: string[];
  paginas: PaginaRevista[];
  pdf: string | null;
};

/** Busca uma edição pelo slug: primeiro nas edições de exemplo, depois no banco. */
export async function carregarEdicao(slug: string): Promise<Edicao> {
  const estatica = revistas.find((r) => r.slug === slug);
  if (estatica) {
    return {
      id: null,
      autorId: null,
      slug: estatica.slug,
      etiqueta: `Edição ${String(estatica.edicao).padStart(2, "0")} · ${estatica.data}`,
      titulo: estatica.titulo,
      subtitulo: estatica.subtitulo,
      descricao: estatica.descricao,
      destaques: estatica.destaques,
      paginas: estatica.conteudo,
      pdf: estatica.pdf,
    };
  }

  const doBanco = await revistaPublicadaPorSlug(slug).catch(() => null);
  if (!doBanco) throw notFound();
  return {
    id: doBanco.id,
    autorId: doBanco.autorId,
    slug: doBanco.slug,
    etiqueta: doBanco.data,
    titulo: doBanco.titulo,
    subtitulo: null,
    descricao: doBanco.resumo,
    destaques: [],
    paginas: doBanco.conteudo.map((texto, i) => ({
      numero: i + 1,
      secao: "Edição",
      titulo: doBanco.titulo,
      texto: [texto],
    })),
    pdf: doBanco.pdf,
  };
}

/**
 * Separa o resumo em texto corrido e tópicos. Linhas que começam com "-" ou "•"
 * viram tópicos, como no resumo da 1ª edição.
 */
export function separarResumo(resumo: string): { texto: string[]; topicos: string[] } {
  const texto: string[] = [];
  const topicos: string[] = [];
  for (const bruta of resumo.split(/\n/)) {
    const linha = bruta.trim();
    if (!linha) continue;
    const topico = linha.match(/^[-•–]\s*(.+)$/);
    // "- A - B" na mesma linha também vira dois tópicos.
    if (topico?.[1]) topicos.push(...topico[1].split(/\s+[-–]\s+/).map((t) => t.trim()).filter(Boolean));
    else texto.push(linha);
  }
  return { texto, topicos };
}

/**
 * Dados de uma edição publicada pelo site prontos para os cards (início e lista de edições).
 * O título vem sempre do campo título (o editado em "Editar edição"); a sinopse é separada
 * em texto e tópicos para não repetir o texto inteiro como título.
 */
export function cardDaEdicao(r: {
  slug: string;
  titulo: string;
  resumo: string;
  data: string;
}) {
  const { texto, topicos } = separarResumo(r.resumo);
  return {
    slug: r.slug,
    titulo: r.titulo,
    subtitulo: r.titulo,
    descricao: texto.join(" "),
    data: r.data,
    destaques: topicos,
    edicao: null as number | null,
  };
}

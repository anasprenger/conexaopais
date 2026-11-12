import { notFound } from "@tanstack/react-router";
import { revistas, type PaginaRevista } from "@/data/mock";
import { revistaPublicadaPorSlug } from "@/lib/publicacoes";

export type Edicao = {
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

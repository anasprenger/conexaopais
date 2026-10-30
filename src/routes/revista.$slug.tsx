import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { revistas, type PaginaRevista } from "@/data/mock";
import { revistaPublicadaPorSlug } from "@/lib/publicacoes";
import { resolverPdf } from "@/lib/conteudo";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaginaPdf } from "@/components/revista/PaginaPdf";

type Edicao = {
  slug: string;
  etiqueta: string;
  titulo: string;
  descricao: string;
  paginas: PaginaRevista[];
  pdf: string | null;
};

export const Route = createFileRoute("/revista/$slug")({
  loader: async ({ params }) => {
    const estatica = revistas.find((r) => r.slug === params.slug);
    if (estatica) {
      return {
        revista: {
          slug: estatica.slug,
          etiqueta: `Edição ${String(estatica.edicao).padStart(2, "0")} · ${estatica.data}`,
          titulo: estatica.titulo,
          descricao: estatica.descricao,
          paginas: estatica.conteudo,
          pdf: estatica.pdf,
        } satisfies Edicao,
      };
    }
    const doBanco = await revistaPublicadaPorSlug(params.slug).catch(() => null);
    if (!doBanco) throw notFound();
    return {
      revista: {
        slug: doBanco.slug,
        etiqueta: doBanco.data,
        titulo: doBanco.titulo,
        descricao: doBanco.resumo,
        paginas: doBanco.conteudo.map((texto, i) => ({
          numero: i + 1,
          secao: "Edição",
          titulo: doBanco.titulo,
          texto: [texto],
        })),
        pdf: doBanco.pdf,
      } satisfies Edicao,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Edição indisponível | Conexão Pais" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { revista } = loaderData;
    const titulo = `${revista.titulo} | Revista Conexão Pais`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: revista.descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: revista.descricao },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: EdicaoNaoEncontrada,
  component: LeitorRevista,
});

function EdicaoNaoEncontrada() {
  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-3xl px-5 text-center">
        <h1 className="font-display text-3xl text-primary">Edição não encontrada</h1>
        <p className="mt-3 text-muted-foreground">
          Talvez esta edição ainda não tenha sido publicada.
        </p>
        <div className="mt-7">
          <Button variant="cta" asChild>
            <Link to="/revista">Ver todas as edições</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}

function LeitorRevista() {
  const { revista } = Route.useLoaderData();
  const [pagina, setPagina] = useState(1);
  const [animacao, setAnimacao] = useState<"folha-avanca" | "folha-volta" | null>(null);
  const [sumarioAberto, setSumarioAberto] = useState(false);
  const [linkPdf, setLinkPdf] = useState<string | null>(null);
  const [totalPdf, setTotalPdf] = useState(1);
  const toqueX = useRef<number | null>(null);

  const total = linkPdf ? totalPdf : Math.max(1, revista.paginas.length);
  const atual = revista.paginas.find((p) => p.numero === pagina) ?? revista.paginas[0];
  const progresso = Math.round((pagina / total) * 100);

  useEffect(() => {
    let ativo = true;
    void resolverPdf(revista.pdf).then((url) => {
      if (ativo) setLinkPdf(url);
    });
    return () => {
      ativo = false;
    };
  }, [revista.pdf]);

  const irPara = useCallback(
    (destino: number) => {
      const alvo = Math.min(total, Math.max(1, destino));
      setPagina((anterior) => {
        if (alvo === anterior) return anterior;
        setAnimacao(alvo > anterior ? "folha-avanca" : "folha-volta");
        window.setTimeout(() => setAnimacao(null), 620);
        return alvo;
      });
    },
    [total],
  );

  const aoCarregarPdf = useCallback((quantidade: number) => {
    setTotalPdf(quantidade);
    setPagina((atual) => Math.min(atual, quantidade));
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") irPara(pagina + 1);
      if (e.key === "ArrowLeft") irPara(pagina - 1);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [irPara, pagina]);

  return (
    <PageLayout>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              {revista.etiqueta}
            </p>
            <h1 className="mt-1 font-display text-2xl text-primary">{revista.titulo}</h1>
          </div>
          <div className="flex gap-2">
            {!linkPdf && revista.paginas.length > 0 && (
              <Button variant="soft" size="sm" onClick={() => setSumarioAberto(true)}>
                <List className="size-4" />
                Sumário
              </Button>
            )}
            {linkPdf && (
              <Button variant="cta" size="sm" asChild>
                <a href={linkPdf} download target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  Baixar PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="rounded-3xl border border-border bg-card p-4 sm:p-10">
          <div className="relative mx-auto max-w-2xl">
            {/* setas fixas nas laterais */}
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => irPara(pagina - 1)}
              disabled={pagina === 1}
              className="absolute -left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card p-3 text-primary shadow-md transition-opacity hover:bg-surface disabled:opacity-30 sm:-left-6"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Próxima página"
              onClick={() => irPara(pagina + 1)}
              disabled={pagina === total}
              className="absolute -right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card p-3 text-primary shadow-md transition-opacity hover:bg-surface disabled:opacity-30 sm:-right-6"
            >
              <ChevronRight className="size-5" />
            </button>

            <div
              className="folha-palco relative"
              onTouchStart={(e) => {
                toqueX.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                const inicio = toqueX.current;
                const fim = e.changedTouches[0]?.clientX ?? null;
                toqueX.current = null;
                if (inicio === null || fim === null) return;
                const delta = fim - inicio;
                if (Math.abs(delta) > 50) irPara(delta < 0 ? pagina + 1 : pagina - 1);
              }}
            >
              <article
                key={pagina}
                className={cn(
                  "folha overflow-hidden rounded-2xl border border-border bg-elevated shadow-sm",
                  animacao,
                )}
              >
                {linkPdf ? (
                  <PaginaPdf url={linkPdf} pagina={pagina} aoCarregar={aoCarregarPdf} />
                ) : (
                  <div className="flex aspect-[3/4] flex-col p-8 sm:p-12">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                      {atual?.secao}
                    </p>
                    <h2 className="mt-5 font-display text-3xl leading-tight text-primary">
                      {atual?.titulo}
                    </h2>
                    <div className="mt-6 space-y-4 text-muted-foreground">
                      {atual?.texto.map((t, i) => <p key={i}>{t}</p>)}
                    </div>
                    <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
                      Página {pagina} de {total}
                    </p>
                  </div>
                )}
              </article>

              {/* zonas de toque estilo story */}
              <button
                type="button"
                aria-label="Voltar uma página"
                onClick={() => irPara(pagina - 1)}
                className="absolute inset-y-0 left-0 z-10 w-2/5 cursor-w-resize"
              />
              <button
                type="button"
                aria-label="Avançar uma página"
                onClick={() => irPara(pagina + 1)}
                className="absolute inset-y-0 right-0 z-10 w-3/5 cursor-e-resize"
              />
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex gap-1.5">
              {Array.from({ length: total }, (_, indice) => indice + 1).map((numero) => (
                <span
                  key={numero}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    numero <= pagina ? "bg-accent" : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {progresso}% da leitura · toque nas laterais ou arraste para virar a página
            </p>
          </div>
        </div>

        {!linkPdf && revista.paginas.length > 0 && <div className="mt-10">
          <h2 className="font-display text-xl text-primary">Nesta edição</h2>
          <ul className="mt-4 space-y-2">
            {revista.paginas.map((p) => (
              <li key={p.numero}>
                <button
                  type="button"
                  onClick={() => irPara(p.numero)}
                  className={cn(
                    "flex w-full items-baseline gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-mint/40",
                    p.numero === pagina && "bg-mint/50",
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                    {String(p.numero).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-primary">{p.titulo}</span>
                  <span className="text-xs text-muted-foreground">{p.secao}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button variant="quiet" asChild>
              <Link to="/revista">Ver todas as edições</Link>
            </Button>
          </div>
        </div>}
      </section>

      {sumarioAberto && !linkPdf && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setSumarioAberto(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-7 sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:rounded-l-3xl sm:rounded-tr-none">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">Sumário</h2>
              <button
                type="button"
                aria-label="Fechar sumário"
                onClick={() => setSumarioAberto(false)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <ul className="mt-5 space-y-1">
              {revista.paginas.map((p) => (
                <li key={p.numero}>
                  <button
                    type="button"
                    onClick={() => {
                      irPara(p.numero);
                      setSumarioAberto(false);
                    }}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-left transition-colors hover:bg-mint/40",
                      p.numero === pagina && "bg-mint/50",
                    )}
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                      {p.secao}
                    </span>
                    <span className="mt-1 block text-primary">{p.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
            {linkPdf && (
              <div className="mt-6">
                <Button variant="soft" className="w-full" asChild>
                  <a href={linkPdf} download target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                    Baixar esta edição em PDF
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

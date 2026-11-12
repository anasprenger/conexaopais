import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Download } from "lucide-react";
import { carregarEdicao, separarResumo } from "@/lib/revista";
import { resolverPdf } from "@/lib/conteudo";
import { EdicaoNaoEncontrada } from "@/components/revista/EdicaoNaoEncontrada";

export const Route = createFileRoute("/revista/$slug")({
  loader: async ({ params }) => ({ revista: await carregarEdicao(params.slug) }),
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
  component: SinopseEdicao,
});

function SinopseEdicao() {
  const { revista } = Route.useLoaderData();
  const [linkPdf, setLinkPdf] = useState<string | null>(null);
  const { texto, topicos } = separarResumo(revista.descricao);
  const destaques = revista.destaques.length > 0 ? revista.destaques : topicos;

  useEffect(() => {
    let ativo = true;
    void resolverPdf(revista.pdf).then((url) => {
      if (ativo) setLinkPdf(url);
    });
    return () => {
      ativo = false;
    };
  }, [revista.pdf]);

  return (
    <PageLayout>
      <section className="relative overflow-hidden bg-surface">
        <div aria-hidden className="blob absolute -right-24 -top-32 size-96 bg-mint/60" />
        <div className="relative mx-auto max-w-6xl px-5 pt-10">
          <Link
            to="/revista"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Todas as edições
          </Link>
        </div>

        <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-5 pb-16 pt-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-14">
          {/* capa */}
          <div className="relative mx-auto flex aspect-[3/4] w-full max-w-xs flex-col overflow-hidden rounded-2xl bg-primary p-7 text-primary-foreground shadow-lg md:max-w-none">
            <div aria-hidden className="blob absolute -bottom-10 -right-10 size-48 bg-accent/40" />
            <p className="relative text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
              Revista Conexão Pais
            </p>
            <h2 className="relative mt-4 font-display text-3xl leading-tight">{revista.titulo}</h2>
            <p className="relative mt-auto pt-6 text-sm text-primary-foreground/80">
              {revista.etiqueta}
            </p>
          </div>

          {/* sinopse */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {revista.etiqueta}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-primary sm:text-5xl">
              {revista.titulo}
            </h1>
            {revista.subtitulo && (
              <p className="mt-3 font-display text-xl text-muted-foreground">
                {revista.subtitulo}
              </p>
            )}

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-primary">
              Sobre esta edição
            </h2>
            <div className="mt-3 space-y-4 text-lg text-muted-foreground">
              {texto.map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </div>

            {destaques.length > 0 && (
              <>
                <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-primary">
                  Nesta edição
                </h2>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {destaques.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      {d}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Button variant="cta" size="lg" asChild>
                <Link to="/revista/$slug/ler" params={{ slug: revista.slug }}>
                  <BookOpen className="size-4" />
                  Começar a leitura
                </Link>
              </Button>
              {linkPdf && (
                <Button variant="soft" size="lg" asChild>
                  <a href={linkPdf} download target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                    Baixar PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

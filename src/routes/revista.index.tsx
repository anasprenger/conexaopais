import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { revistasPublicadas, type RevistaDb } from "@/lib/publicacoes";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { revistas } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BotaoExcluirPublicacao } from "@/components/admin/BotaoExcluirPublicacao";
import { useOcultos } from "@/lib/ocultos";

export const Route = createFileRoute("/revista/")({
  head: () => ({
    meta: [
      { title: "Revista digital do Conexão Pais | Edições" },
      {
        name: "description",
        content:
          "Leia a revista digital do Conexão Pais direto na plataforma: edição atual, edições anteriores e destaques de cada número.",
      },
      { property: "og:title", content: "Revista | Conexão Pais" },
      {
        property: "og:description",
        content: "Uma revista feita para famílias, com leitura confortável dentro da plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RevistaIndex,
});

function RevistaIndex() {
  const { estaOculto, esconder } = useOcultos();
  const visiveis = revistas.filter((r) => !estaOculto("revista", r.slug));
  const [novas, setNovas] = useState<RevistaDb[]>([]);
  const novaAtual = novas[0];
  const atual = novaAtual
    ? {
        slug: novaAtual.slug,
        titulo: novaAtual.titulo,
        subtitulo: novaAtual.resumo,
        descricao: novaAtual.resumo,
        data: novaAtual.data,
        destaques: [] as string[],
        edicao: null as number | null,
      }
    : visiveis[0];
  const novasAnteriores = novaAtual ? novas.slice(1) : novas;
  const anteriores = novaAtual ? visiveis : visiveis.slice(1);

  useEffect(() => {
    void revistasPublicadas().then(setNovas);
  }, []);



  return (
    <PageLayout>
      <PageHero
        eyebrow="Revista digital"
        title="Nossa revista"
        description="Cada edição reúne reportagens, entrevistas e ensaios sobre a vida em família — para ler com calma, dentro da própria plataforma."
      />

      <section className="section-y mx-auto max-w-6xl px-5">
        {atual && (
          <article className="relative grid items-center gap-10 rounded-3xl border border-border bg-card p-8 md:grid-cols-[minmax(0,18rem)_1fr] md:p-10">
            <div className="absolute right-4 top-4">
              <BotaoExcluirPublicacao
                id={novaAtual?.id}
                slug={atual.slug}
                titulo={atual.titulo}
                tipo="revista"
                autorId={novaAtual?.autorId}
                exemplo={!novaAtual}
                aoExcluir={() =>
                  novaAtual
                    ? setNovas((lista) => lista.filter((item) => item.id !== novaAtual.id))
                    : esconder("revista", atual.slug)
                }
              />
            </div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-primary p-7 text-primary-foreground">
              <div aria-hidden className="blob absolute -bottom-10 -right-10 size-48 bg-accent/40" />
              <p className="relative text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
                {atual.edicao ? `Edição ${String(atual.edicao).padStart(2, "0")}` : "Nova edição"}
              </p>
              <h2 className="relative mt-4 font-display text-3xl leading-tight">{atual.titulo}</h2>
              <p className="relative mt-auto pt-6 text-sm text-primary-foreground/80">
                {atual.data}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Edição atual
              </span>
              <h3 className="mt-3 font-display text-3xl text-primary">{atual.subtitulo}</h3>
              <p className="mt-4 text-lg text-muted-foreground">{atual.descricao}</p>
              {atual.destaques.length > 0 && (
                <ul className="mt-6 space-y-2 text-muted-foreground">
                  {atual.destaques.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8">
                <Button variant="cta" asChild>
                  <Link to="/revista/$slug" params={{ slug: atual.slug }}>
                    Conheça esta edição
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        )}

        {novasAnteriores.length > 0 && (
          <>
            <h2 className="mt-16 font-display text-2xl text-primary">Novas edições</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {novasAnteriores.map((r) => (
                <div key={r.slug} className="relative">
                  <Link
                    to="/revista/$slug"
                    params={{ slug: r.slug }}
                    className="group block rounded-3xl border border-border bg-card p-8 transition-colors hover:bg-surface"
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                      {r.data}
                    </span>
                    <h3 className="mt-3 font-display text-2xl text-primary">{r.titulo}</h3>
                    <p className="mt-3 text-muted-foreground">{r.resumo}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Ler edição
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                  <div className="absolute right-4 top-4">
                    <BotaoExcluirPublicacao
                      id={r.id}
                      slug={r.slug}
                      titulo={r.titulo}
                      tipo="revista"
                      autorId={r.autorId}
                      aoExcluir={() => setNovas((lista) => lista.filter((x) => x.id !== r.id))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-16 font-display text-2xl text-primary">Edições anteriores</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {anteriores.map((r) => (
            <div key={r.slug} className="relative">
              <Link
                to="/revista/$slug"
                params={{ slug: r.slug }}
                className="group block rounded-3xl border border-border bg-mint/40 p-8 transition-colors hover:bg-mint/70"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                  Edição {String(r.edicao).padStart(2, "0")} · {r.data}
                </span>
                <h3 className="mt-3 font-display text-2xl text-primary">{r.titulo}</h3>
                <p className="mt-3 text-muted-foreground">{r.descricao}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Ler edição
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <div className="absolute right-4 top-4">
                <BotaoExcluirPublicacao
                  slug={r.slug}
                  titulo={r.titulo}
                  tipo="revista"
                  exemplo
                  aoExcluir={() => esconder("revista", r.slug)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

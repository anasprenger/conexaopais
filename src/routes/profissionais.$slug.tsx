import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { artigos, colunas, profissionais, type Artigo } from "@/data/mock";
import { artigosPorNomeAutor } from "@/lib/publicacoes";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail } from "lucide-react";

export const Route = createFileRoute("/profissionais/$slug")({
  loader: ({ params }) => {
    const profissional = profissionais.find((p) => p.slug === params.slug);
    if (!profissional) throw notFound();
    return {
      profissional,
      conteudos: artigos.filter((a) => a.autor === profissional.nome),
      colunasDoAutor: colunas.filter((c) => c.colunista === profissional.nome),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Profissional indisponível | Conexão Pais" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { profissional } = loaderData;
    const titulo = `${profissional.nome} — ${profissional.especialidade} | Conexão Pais`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: profissional.descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: profissional.descricao },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProfissionalNaoEncontrado,
  component: PerfilProfissional,
});

function ProfissionalNaoEncontrado() {
  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-3xl px-5 text-center">
        <h1 className="font-display text-3xl text-primary">Perfil não encontrado</h1>
        <p className="mt-3 text-muted-foreground">
          Este profissional pode não estar mais com o perfil público.
        </p>
        <div className="mt-7">
          <Button variant="cta" asChild>
            <Link to="/profissionais">Ver profissionais</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}

function PerfilProfissional() {
  const { profissional, conteudos: doSite, colunasDoAutor } = Route.useLoaderData();
  const [doBanco, setDoBanco] = useState<Artigo[]>([]);

  useEffect(() => {
    void artigosPorNomeAutor(profissional.nome).then(setDoBanco);
  }, [profissional.nome]);

  const conteudos = [...doBanco, ...doSite];

  return (
    <PageLayout>
      <section className="relative overflow-hidden bg-surface">
        <div aria-hidden className="blob absolute -right-24 -top-32 size-96 bg-mint/60" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-7 px-5 py-16 sm:flex-row sm:items-center">
          <span className="blob flex size-28 shrink-0 items-center justify-center bg-primary font-display text-3xl text-primary-foreground">
            {profissional.iniciais}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {profissional.especialidade}
            </p>
            <h1 className="mt-3 font-display text-4xl text-primary">{profissional.nome}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{profissional.descricao}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {profissional.cidade} · {profissional.atendimento}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="cta" size="sm" asChild>
                <a
                  href={`https://wa.me/${profissional.whatsapp}?text=${encodeURIComponent(
                    `Olá, ${profissional.nome}! Encontrei seu perfil no Conexão Pais e gostaria de conversar.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Enviar mensagem no WhatsApp
                </a>
              </Button>
              <Button variant="quiet" size="sm" asChild>
                <Link to="/contato">
                  <Mail className="size-4" />
                  Falar com a equipe
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-y mx-auto max-w-5xl px-5">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8">
            <h2 className="font-display text-xl text-primary">Formação</h2>
            <p className="mt-3 text-muted-foreground">
              Graduação e especialização na área de {profissional.especialidade.toLowerCase()}, com
              formação continuada em atendimento a famílias.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-mint/40 p-8">
            <h2 className="font-display text-xl text-primary">Experiência</h2>
            <p className="mt-3 text-muted-foreground">
              Atendimento a responsáveis, crianças e adolescentes, com escuta orientada ao contexto
              de cada família.
            </p>
          </div>
        </div>

        {conteudos.length > 0 && (
          <>
            <h2 className="mt-14 font-display text-2xl text-primary">Conteúdos publicados</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {conteudos.map((a) => (
                <Link
                  key={a.slug}
                  to="/artigos/$slug"
                  params={{ slug: a.slug }}
                  className="rounded-3xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                    {a.categoria}
                  </span>
                  <h3 className="mt-3 font-display text-xl text-primary">{a.titulo}</h3>
                  <p className="mt-3 text-muted-foreground">{a.resumo}</p>
                </Link>
              ))}
            </div>
          </>
        )}

        {colunasDoAutor.length > 0 && (
          <>
            <h2 className="mt-14 font-display text-2xl text-primary">Colunas</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {colunasDoAutor.map((c) => (
                <Link
                  key={c.slug}
                  to="/colunas/$slug"
                  params={{ slug: c.slug }}
                  className="rounded-3xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
                >
                  <h3 className="font-display text-xl text-primary">{c.nome}</h3>
                  <p className="mt-2 text-muted-foreground">{c.chamada}</p>
                  <p className="mt-4 text-sm text-muted-foreground">{c.periodicidade}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </PageLayout>
  );
}

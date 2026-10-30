import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Sparkles, Users } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { artigos, profissionais, revistas } from "@/data/mock";
import heroImg from "@/assets/hero-familia.jpg";
import { revistasPublicadas, type RevistaDb } from "@/lib/publicacoes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conexão Pais | Ajudando a unir famílias e gerações" },
      {
        name: "description",
        content:
          "Portal de conteúdo, colunas e profissionais parceiros para quem cuida, educa e acompanha. Informação com acolhimento.",
      },
      { property: "og:title", content: "Conexão Pais | Famílias e gerações" },
      {
        property: "og:description",
        content: "Informação, acolhimento e conexão para quem cuida, educa e acompanha.",
      },
    ],
  }),
  component: Index,
});

const passos = [
  { icon: BookOpen, titulo: "Explore", texto: "Encontre conteúdos e informações confiáveis." },
  { icon: Users, titulo: "Conecte-se", texto: "Conheça profissionais e outras famílias." },
  { icon: Sparkles, titulo: "Participe", texto: "Interaja, salve conteúdos e compartilhe." },
];

function Index() {
  const destaque = artigos[0]!;
  const demais = artigos.slice(1);
  const edicaoPadrao = revistas[0]!;
  const [revistaNova, setRevistaNova] = useState<RevistaDb | null>(null);
  const edicaoAtual = revistaNova
    ? {
        slug: revistaNova.slug,
        titulo: revistaNova.titulo,
        subtitulo: revistaNova.resumo,
        descricao: revistaNova.resumo,
        data: revistaNova.data,
        edicao: null as number | null,
      }
    : edicaoPadrao;

  useEffect(() => {
    void revistasPublicadas().then(([maisRecente]) => setRevistaNova(maisRecente ?? null));
  }, []);


  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface">
        <div aria-hidden className="blob absolute -left-40 top-10 size-[28rem] bg-mint/50" />
        <div
          aria-hidden
          className="absolute -right-20 bottom-0 size-72 rounded-full border-[3rem] border-accent/15"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Conexão Pais
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-primary sm:text-6xl">
              Ajudando a unir famílias e gerações.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Informação, acolhimento e conexão para quem cuida, educa e acompanha — em um só lugar.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button variant="cta" size="lg" asChild>
                <Link to="/sobre">Conheça o projeto</Link>
              </Button>
              <Button variant="quiet" size="lg" asChild>
                <Link to="/artigos">Explorar conteúdos</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Família de três gerações rindo junta ao ar livre"
              width={1200}
              height={1408}
              className="w-full rounded-[3rem] object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Apresentação */}
      <section className="section-y mx-auto max-w-4xl px-5 text-center">
        <h2 className="font-display text-3xl text-primary sm:text-4xl">
          Cuidar dá trabalho. Encontrar boa informação não deveria dar.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Reunimos conteúdo editorial, colunas assinadas e profissionais de confiança em um ambiente
          humano, claro e livre de julgamento — pensado para todas as configurações de família.
        </p>
      </section>

      {/* Conteúdos */}
      <section className="section-y bg-mint/40">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-primary sm:text-4xl">Conteúdos para você</h2>
            <Link
              to="/artigos"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
            >
              Ver todos <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Link
              to="/artigos/$slug"
              params={{ slug: destaque.slug }}
              className="block rounded-[2rem] bg-card p-9 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                {destaque.categoria}
              </span>
              <h3 className="mt-4 font-display text-3xl leading-tight text-primary">
                {destaque.titulo}
              </h3>
              <p className="mt-4 text-muted-foreground">{destaque.resumo}</p>
              <p className="mt-6 text-sm text-muted-foreground">
                {destaque.autor} · {destaque.data} · {destaque.leitura}
              </p>
            </Link>

            <div className="grid gap-5">
              {demais.map((a) => (
                <Link
                  key={a.slug}
                  to="/artigos/$slug"
                  params={{ slug: a.slug }}
                  className="block rounded-3xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                    {a.categoria}
                  </span>
                  <h3 className="mt-2 font-display text-xl text-primary">{a.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{a.resumo}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {a.autor} · {a.leitura}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Revista */}
      <section className="section-y mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,16rem)_1fr]">
          <Link
            to="/revista/$slug"
            params={{ slug: edicaoAtual.slug }}
            className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground"
          >
            <div aria-hidden className="blob absolute -bottom-10 -right-10 size-44 bg-accent/40" />
            <p className="relative text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
              {edicaoAtual.edicao
                ? `Edição ${String(edicaoAtual.edicao).padStart(2, "0")}`
                : "Nova edição"}
            </p>
            <h3 className="relative mt-4 font-display text-2xl leading-tight">
              {edicaoAtual.titulo}
            </h3>
            <p className="relative mt-auto text-sm text-primary-foreground/80">
              {edicaoAtual.data}
            </p>
          </Link>

          <div>
            <h2 className="font-display text-3xl text-primary sm:text-4xl">Nossa revista</h2>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">{edicaoAtual.subtitulo}</p>
            <p className="mt-3 max-w-xl text-muted-foreground">{edicaoAtual.descricao}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="cta" asChild>
                <Link to="/revista/$slug" params={{ slug: edicaoAtual.slug }}>
                  Conheça esta edição
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="quiet" asChild>
                <Link to="/revista">Ver todas as edições</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Profissionais */}
      <section className="section-y mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl text-primary sm:text-4xl">Conheça quem pode ajudar</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {profissionais.map((p) => (
            <article key={p.slug} className="rounded-3xl border border-border p-6">
              <div className="blob flex size-14 items-center justify-center bg-accent/15 font-display text-accent">
                {p.iniciais}
              </div>
              <h3 className="mt-4 font-display text-lg text-primary">{p.nome}</h3>
              <p className="text-sm font-medium text-accent">{p.especialidade}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
              <Link
                to="/profissionais/$slug"
                params={{ slug: p.slug }}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
              >
                Ver perfil <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="section-y bg-surface">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl text-primary sm:text-4xl">Como funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {passos.map((p, i) => (
              <div key={p.titulo} className="rounded-3xl bg-card p-8 shadow-sm">
                <p.icon className="size-6 text-accent" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Passo {i + 1}
                </p>
                <h3 className="mt-1 font-display text-2xl text-primary">{p.titulo}</h3>
                <p className="mt-2 text-muted-foreground">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chamada final */}
      <section className="section-y mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 text-center text-primary-foreground">
          <div aria-hidden className="blob absolute -right-20 -top-20 size-72 bg-accent/25" />
          <h2 className="relative font-display text-4xl">Faça parte dessa conexão.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Crie sua conta para salvar conteúdos, acompanhar colunas e conversar com profissionais.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="cta" size="lg" asChild>
              <Link to="/contato">Criar minha conta</Link>
            </Button>
            <Button variant="soft" size="lg" asChild>
              <Link to="/artigos">Conhecer conteúdos</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

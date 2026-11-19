import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { colunas, profissionais, tempoLeitura } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, ChevronDown, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { alternarInteracao, minhasInteracoes, registrarEvento } from "@/lib/conteudo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/colunas/$slug")({
  loader: ({ params }) => {
    const coluna = colunas.find((c) => c.slug === params.slug);
    if (!coluna) throw notFound();
    const autor = profissionais.find((p) => p.nome === coluna.colunista) ?? null;
    return { coluna, autor };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Coluna indisponível | Conexão Pais" }, { name: "robots", content: "noindex" }],
      };
    }
    const { coluna } = loaderData;
    const titulo = `${coluna.nome}, por ${coluna.colunista} | Conexão Pais`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: coluna.sobre },
        { property: "og:title", content: titulo },
        { property: "og:description", content: coluna.sobre },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ColunaNaoEncontrada,
  component: ColunaPage,
});

function ColunaNaoEncontrada() {
  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-3xl px-5 text-center">
        <h1 className="font-display text-3xl text-primary">Coluna não encontrada</h1>
        <p className="mt-3 text-muted-foreground">Esta coluna pode ter sido encerrada.</p>
        <div className="mt-7">
          <Button variant="cta" asChild>
            <Link to="/colunas">Ver todas as colunas</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}

function ColunaPage() {
  const { coluna, autor } = Route.useLoaderData();
  const { user } = useAuth();
  const [aberto, setAberto] = useState<string | null>(coluna.posts[0]?.slug ?? null);
  // Curtidas e salvos das publicações da coluna (pelo slug de cada publicação).
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set());
  const [salvos, setSalvos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setCurtidos(new Set());
      setSalvos(new Set());
      return;
    }
    void minhasInteracoes(user.id).then((dados) => {
      setCurtidos(new Set(dados.filter((d) => d.tipo === "curtida").map((d) => d.publicacao_slug)));
      setSalvos(new Set(dados.filter((d) => d.tipo === "salvo").map((d) => d.publicacao_slug)));
    });
  }, [user]);

  // Abrir uma publicação conta como leitura no painel de interações.
  useEffect(() => {
    if (aberto) void registrarEvento("coluna", aberto);
  }, [aberto]);

  const alternar = async (slug: string, tipo: "curtida" | "salvo") => {
    if (!user) {
      toast.error("Entre na sua conta para curtir e salvar.");
      return;
    }
    const conjunto = tipo === "curtida" ? curtidos : salvos;
    const ativo = conjunto.has(slug);
    await alternarInteracao(user.id, slug, tipo, ativo);
    const novo = new Set(conjunto);
    if (ativo) novo.delete(slug);
    else novo.add(slug);
    (tipo === "curtida" ? setCurtidos : setSalvos)(novo);
  };

  return (
    <PageLayout>
      <section className="relative overflow-hidden bg-surface">
        <div aria-hidden className="blob absolute -right-24 -top-28 size-96 bg-mint/60" />
        <div className="relative mx-auto max-w-3xl px-5 py-16">
          <Link
            to="/colunas"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Colunas
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {coluna.periodicidade}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-primary">{coluna.nome}</h1>
          <p className="mt-5 text-lg text-muted-foreground">{coluna.sobre}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {autor ? (
              <Button variant="soft" size="sm" asChild>
                <Link to="/profissionais/$slug" params={{ slug: autor.slug }}>
                  por {coluna.colunista}
                </Link>
              </Button>
            ) : (
              <span className="text-sm font-medium text-primary">por {coluna.colunista}</span>
            )}
            <span className="text-sm text-muted-foreground">
              {coluna.posts.length} {coluna.posts.length === 1 ? "publicação" : "publicações"}
            </span>
          </div>
        </div>
      </section>

      <section className="section-y mx-auto max-w-3xl px-5">
        <h2 className="font-display text-2xl text-primary">Publicações</h2>
        <div className="mt-6 space-y-4">
          {coluna.posts.map((post) => {
            const abertoAgora = aberto === post.slug;
            return (
              <article key={post.slug} className="rounded-3xl border border-border bg-card p-7">
                <button
                  type="button"
                  onClick={() => setAberto(abertoAgora ? null : post.slug)}
                  aria-expanded={abertoAgora}
                  className="flex w-full items-start gap-4 text-left"
                >
                  <span className="flex-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                      {post.data} · {tempoLeitura(post.texto)} de leitura
                    </span>
                    <span className="mt-2 block font-display text-xl text-primary">
                      {post.titulo}
                    </span>
                    <span className="mt-2 block text-muted-foreground">{post.resumo}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "mt-1 size-5 shrink-0 text-muted-foreground transition-transform",
                      abertoAgora && "rotate-180",
                    )}
                  />
                </button>

                {abertoAgora && (
                  <div className="mt-6 space-y-4 border-t border-border pt-6 text-lg leading-relaxed text-foreground/85">
                    {post.texto.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => void alternar(post.slug, "curtida")}
                        aria-pressed={curtidos.has(post.slug)}
                        className={cn(curtidos.has(post.slug) && "bg-accent/20 text-accent")}
                      >
                        <Heart className={cn("size-4", curtidos.has(post.slug) && "fill-current")} />
                        {curtidos.has(post.slug) ? "Curtido" : "Curtir"}
                      </Button>
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => void alternar(post.slug, "salvo")}
                        aria-pressed={salvos.has(post.slug)}
                        className={cn(salvos.has(post.slug) && "bg-accent/20 text-accent")}
                      >
                        <Bookmark
                          className={cn("size-4", salvos.has(post.slug) && "fill-current")}
                        />
                        {salvos.has(post.slug) ? "Salvo" : "Salvar"}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </PageLayout>
  );
}

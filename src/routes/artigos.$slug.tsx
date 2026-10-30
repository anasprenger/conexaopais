import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { artigos } from "@/data/mock";
import { artigoPublicadoPorSlug } from "@/lib/publicacoes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, Heart, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { alternarInteracao, marcarLido, minhasInteracoes } from "@/lib/conteudo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/artigos/$slug")({
  loader: async ({ params }) => {
    const artigo =
      artigos.find((a) => a.slug === params.slug) ?? (await artigoPublicadoPorSlug(params.slug));
    if (!artigo) throw notFound();
    const relacionados = artigos.filter((a) => a.slug !== artigo.slug).slice(0, 2);
    return { artigo, relacionados };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Artigo indisponível | Conexão Pais" }, { name: "robots", content: "noindex" }],
      };
    }
    const { artigo } = loaderData;
    return {
      meta: [
        { title: `${artigo.titulo} | Conexão Pais` },
        { name: "description", content: artigo.resumo },
        { property: "og:title", content: artigo.titulo },
        { property: "og:description", content: artigo.resumo },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ArtigoNaoEncontrado,
  component: ArtigoPage,
});

function ArtigoNaoEncontrado() {
  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-3xl px-5 text-center">
        <h1 className="font-display text-3xl text-primary">Artigo não encontrado</h1>
        <p className="mt-3 text-muted-foreground">Este conteúdo pode ter sido movido ou despublicado.</p>
        <div className="mt-7">
          <Button variant="cta" asChild>
            <Link to="/artigos">Voltar para os artigos</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}

type Comentario = {
  id: string;
  texto: string;
  created_at: string;
  user_id: string;
  autor: string;
  curtidas: number;
  curtiEu: boolean;
};

function ArtigoPage() {
  const { artigo, relacionados } = Route.useLoaderData();
  const { user, ehAdmin } = useAuth();
  const [curtido, setCurtido] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregarComentarios = useCallback(async () => {
    const { data } = await supabase
      .from("comentarios")
      .select("id, texto, created_at, user_id")
      .eq("publicacao_slug", artigo.slug)
      .order("created_at", { ascending: false });
    const lista = data ?? [];
    if (lista.length === 0) {
      setComentarios([]);
      return;
    }
    const ids = lista.map((c) => c.id);
    const autores = [...new Set(lista.map((c) => c.user_id))];
    const [{ data: curtidas }, { data: perfis }] = await Promise.all([
      supabase.rpc("comment_like_summary", { _comment_ids: ids }),
      supabase.rpc("public_profiles", { _ids: autores }),
    ]);
    setComentarios(
      lista.map((c) => ({
        ...c,
        autor: perfis?.find((p) => p.id === c.user_id)?.display_name ?? "Participante",
        curtidas: Number((curtidas ?? []).find((k) => k.comentario_id === c.id)?.total ?? 0),
        curtiEu: (curtidas ?? []).find((k) => k.comentario_id === c.id)?.liked_by_me ?? false,
      })),
    );
  }, [artigo.slug, user?.id]);

  useEffect(() => {
    void carregarComentarios();
  }, [carregarComentarios]);

  useEffect(() => {
    if (!user) {
      setCurtido(false);
      setSalvo(false);
      return;
    }
    void minhasInteracoes(user.id).then((dados) => {
      setCurtido(dados.some((d) => d.tipo === "curtida" && d.publicacao_slug === artigo.slug));
      setSalvo(dados.some((d) => d.tipo === "salvo" && d.publicacao_slug === artigo.slug));
    });
    void marcarLido(user.id, artigo.slug);
  }, [user, artigo.slug]);

  const alternar = async (tipo: "curtida" | "salvo") => {
    if (!user) {
      toast.error("Entre na sua conta para curtir e salvar.");
      return;
    }
    const ativo = tipo === "curtida" ? curtido : salvo;
    await alternarInteracao(user.id, artigo.slug, tipo, ativo);
    (tipo === "curtida" ? setCurtido : setSalvo)(!ativo);
  };

  const comentar = async () => {
    if (!user) {
      toast.error("Entre na sua conta para comentar.");
      return;
    }
    if (texto.trim().length < 3) return;
    setEnviando(true);
    const { error } = await supabase
      .from("comentarios")
      .insert({ user_id: user.id, publicacao_slug: artigo.slug, texto: texto.trim() });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível publicar seu comentário.");
      return;
    }
    setTexto("");
    void carregarComentarios();
  };

  const curtirComentario = async (c: Comentario) => {
    if (!user) {
      toast.error("Entre na sua conta para curtir comentários.");
      return;
    }
    if (c.curtiEu) {
      await supabase
        .from("comentario_curtidas")
        .delete()
        .eq("comentario_id", c.id)
        .eq("user_id", user.id);
    } else {
      await supabase.from("comentario_curtidas").insert({ comentario_id: c.id, user_id: user.id });
    }
    void carregarComentarios();
  };

  const excluirComentario = async (c: Comentario) => {
    const { error } = await supabase.from("comentarios").delete().eq("id", c.id);
    if (error) {
      toast.error("Não foi possível excluir este comentário.");
      return;
    }
    toast.success("Comentário excluído.");
    void carregarComentarios();
  };

  const compartilhar = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: artigo.titulo, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado.");
      }
    } catch {
      /* cancelado pelo usuário */
    }
  };

  const corpo = artigo.conteudo ?? [
    artigo.resumo,
    "Não existe fórmula pronta para a vida em família. O que existe são combinados possíveis, ajustados ao momento de cada casa — e revistos sempre que preciso.",
    "Comece pequeno: escolha uma situação recorrente da rotina e observe o que costuma acontecer antes do conflito. Muitas vezes o ajuste está no contexto, não na criança.",
    "Se algo continuar difícil, procurar ajuda profissional não é sinal de fracasso. É parte do cuidado, e existe gente preparada para caminhar junto.",
  ];

  return (
    <PageLayout>
      <article>
        <header className="bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              {artigo.categoria}
            </span>
            <h1 className="mt-4 font-display text-4xl leading-tight text-primary">{artigo.titulo}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{artigo.resumo}</p>
            <p className="mt-6 text-sm text-muted-foreground">
              {artigo.autor} · {artigo.data} · {artigo.leitura} de leitura
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-5 py-14">
          <div className="mb-10 aspect-[16/9] overflow-hidden rounded-3xl bg-mint/60" aria-hidden />

          <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
            {corpo.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <ul className="mt-10 flex flex-wrap gap-2">
            {(artigo.tags ?? [artigo.categoria, "Família", "Cuidado"]).map((t) => (
              <li
                key={t}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                #{t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-8">
            <Button
              variant="soft"
              size="sm"
              onClick={() => void alternar("curtida")}
              aria-pressed={curtido}
              className={cn(curtido && "bg-accent/20 text-accent")}
            >
              <Heart className={cn("size-4", curtido && "fill-current")} />
              {curtido ? "Curtido" : "Curtir"}
            </Button>
            <Button
              variant="soft"
              size="sm"
              onClick={() => void alternar("salvo")}
              aria-pressed={salvo}
              className={cn(salvo && "bg-accent/20 text-accent")}
            >
              <Bookmark className={cn("size-4", salvo && "fill-current")} />
              {salvo ? "Salvo" : "Salvar"}
            </Button>
            <Button variant="soft" size="sm" onClick={() => void compartilhar()}>
              <Share2 className="size-4" />
              Compartilhar
            </Button>
          </div>

          <section className="mt-12 rounded-3xl border border-border bg-card p-8">
            <h2 className="font-display text-xl text-primary">
              Comentários {comentarios.length > 0 && `(${comentarios.length})`}
            </h2>

            {user ? (
              <div className="mt-5 space-y-3">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={3}
                  className="rounded-2xl"
                  placeholder="Escreva seu comentário com respeito e cuidado."
                />
                <Button
                  variant="cta"
                  size="sm"
                  disabled={enviando || texto.trim().length < 3}
                  onClick={() => void comentar()}
                >
                  {enviando ? "Publicando..." : "Publicar comentário"}
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-2 text-muted-foreground">
                  Entre na sua conta para comentar e responder outras famílias.
                </p>
                <div className="mt-5">
                  <Button variant="cta" size="sm" asChild>
                    <Link to="/auth">Entrar / criar conta</Link>
                  </Button>
                </div>
              </>
            )}

            <ul className="mt-8 space-y-4">
              {comentarios.map((c) => (
                <li key={c.id} className="rounded-2xl bg-surface p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-primary">{c.autor}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      {user && (c.user_id === user.id || ehAdmin) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Mais opções do comentário"
                              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-primary"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl">
                            <DropdownMenuItem
                              onSelect={() => void excluirComentario(c)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-4" />
                              Excluir comentário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-foreground/85">{c.texto}</p>
                  <button
                    type="button"
                    onClick={() => void curtirComentario(c)}
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent",
                      c.curtiEu && "text-accent",
                    )}
                  >
                    <Heart className={cn("size-4", c.curtiEu && "fill-current")} />
                    {c.curtidas}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>

      <section className="section-y bg-surface">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-2xl text-primary">Conteúdos relacionados</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {relacionados.map((a) => (
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
        </div>
      </section>
    </PageLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { artigos as artigosBase, type Artigo } from "@/data/mock";
import { artigosPublicados } from "@/lib/publicacoes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BotaoExcluirPublicacao } from "@/components/admin/BotaoExcluirPublicacao";
import { useOcultos } from "@/lib/ocultos";

export const Route = createFileRoute("/artigos/")({
  head: () => ({
    meta: [
      { title: "Artigos sobre família e educação | Conexão Pais" },
      {
        name: "description",
        content:
          "Biblioteca de artigos sobre desenvolvimento infantil, educação, convivência familiar e relações entre gerações.",
      },
      { property: "og:title", content: "Artigos | Conexão Pais" },
      { property: "og:description", content: "Conteúdo confiável para quem cuida e educa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Artigos,
});

function Artigos() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [doBanco, setDoBanco] = useState<Artigo[]>([]);
  const { estaOculto, esconder } = useOcultos();

  useEffect(() => {
    void artigosPublicados().then(setDoBanco);
  }, []);

  const todos = useMemo<Artigo[]>(
    () => [...doBanco, ...artigosBase].filter((a) => !estaOculto("artigo", a.slug)),
    [doBanco, estaOculto],
  );
  const categorias = useMemo(
    () => ["Todos", ...new Set(todos.map((a) => a.categoria))],
    [todos],
  );

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todos.filter((a) => {
      const combinaCategoria = categoria === "Todos" || a.categoria === categoria;
      const combinaBusca =
        termo === "" ||
        a.titulo.toLowerCase().includes(termo) ||
        a.resumo.toLowerCase().includes(termo) ||
        a.autor.toLowerCase().includes(termo);
      return combinaCategoria && combinaBusca;
    });
  }, [busca, categoria, todos]);

  return (
    <PageLayout>
      <PageHero
        eyebrow="Biblioteca"
        title="Artigos"
        description="Textos curtos e práticos, escritos e revisados por profissionais que convivem com famílias todos os dias."
      />

      <section className="section-y mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar artigos..."
            aria-label="Buscar artigos"
            className="h-11 rounded-full sm:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <Button
                key={c}
                variant={c === categoria ? "default" : "soft"}
                size="sm"
                onClick={() => setCategoria(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {resultados.length === 0 ? (
          <p className="mt-12 text-muted-foreground">Nenhum artigo encontrado para esta busca.</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {resultados.map((a) => (
              <div key={a.slug} className="relative">
                <Link
                  to="/artigos/$slug"
                  params={{ slug: a.slug }}
                  className="group block rounded-3xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                    {a.categoria}
                  </span>
                  <h2 className="mt-3 font-display text-2xl text-primary group-hover:text-primary/80">
                    {a.titulo}
                  </h2>
                  <p className="mt-3 text-muted-foreground">{a.resumo}</p>
                  <p className="mt-5 text-sm text-muted-foreground">
                    {a.autor} · {a.data} · {a.leitura} de leitura
                  </p>
                </Link>
                <div className="absolute right-4 top-4">
                  <BotaoExcluirPublicacao
                    id={a.id}
                    slug={a.slug}
                    titulo={a.titulo}
                    tipo="artigo"
                    autorId={a.autorId}
                    exemplo={!a.id}
                    aoExcluir={() => {
                      if (a.id) setDoBanco((lista) => lista.filter((x) => x.id !== a.id));
                      else esconder("artigo", a.slug);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}

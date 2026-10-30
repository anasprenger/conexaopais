import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { colunas } from "@/data/mock";
import { colunasPublicadas, type PublicacaoDb } from "@/lib/publicacoes";
import { BotaoExcluirPublicacao } from "@/components/admin/BotaoExcluirPublicacao";
import { useOcultos } from "@/lib/ocultos";

export const Route = createFileRoute("/colunas/")({
  head: () => ({
    meta: [
      { title: "Colunas assinadas | Conexão Pais" },
      {
        name: "description",
        content:
          "Colunas periódicas escritas por profissionais parceiros sobre cuidado, educação e convivência entre gerações.",
      },
      { property: "og:title", content: "Colunas | Conexão Pais" },
      { property: "og:description", content: "Vozes que acompanham famílias de perto." },
    ],
  }),
  component: Colunas,
});

function Colunas() {
  const [doBanco, setDoBanco] = useState<PublicacaoDb[]>([]);
  const { estaOculto, esconder } = useOcultos();

  useEffect(() => {
    void colunasPublicadas().then(setDoBanco);
  }, []);

  return (
    <PageLayout>
      <PageHero
        eyebrow="Colunas"
        title="Vozes que acompanham famílias de perto"
        description="Espaços fixos de autoria, com periodicidade própria e ponto de vista assumido."
      />

      <section className="section-y mx-auto max-w-6xl px-5">
        <div className="grid gap-6 md:grid-cols-3">
          {colunas
            .filter((c) => !estaOculto("coluna", c.slug))
            .map((c) => (
              <div key={c.slug} className="relative">
                <Link
                  to="/colunas/$slug"
                  params={{ slug: c.slug }}
                  className="block rounded-3xl bg-mint/50 p-8 transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-mint-foreground/70">
                    {c.periodicidade}
                  </span>
                  <h2 className="mt-3 font-display text-2xl text-primary">{c.nome}</h2>
                  <p className="mt-3 text-mint-foreground/80">{c.chamada}</p>
                  <p className="mt-6 text-sm font-medium text-primary">por {c.colunista}</p>
                  <p className="mt-2 text-sm text-mint-foreground/70">
                    {c.posts.length} {c.posts.length === 1 ? "publicação" : "publicações"} · abrir
                    coluna
                  </p>
                </Link>
                <div className="absolute right-4 top-4">
                  <BotaoExcluirPublicacao
                    slug={c.slug}
                    titulo={c.nome}
                    tipo="coluna"
                    exemplo
                    aoExcluir={() => esconder("coluna", c.slug)}
                  />
                </div>
              </div>
            ))}
        </div>

        {doBanco.length > 0 && (
          <>
            <h2 className="mt-16 font-display text-2xl text-primary">Novas colunas</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {doBanco.map((c) => (
                <article key={c.id} className="relative rounded-3xl bg-mint/50 p-8">
                  <span className="text-xs font-semibold uppercase tracking-widest text-mint-foreground/70">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <h3 className="mt-3 font-display text-2xl text-primary">{c.titulo}</h3>
                  <p className="mt-3 text-mint-foreground/80">{c.resumo}</p>
                  <div className="absolute right-4 top-4">
                    <BotaoExcluirPublicacao
                      id={c.id}
                      slug={c.slug}
                      titulo={c.titulo}
                      tipo="coluna"
                      autorId={c.autor_id}
                      aoExcluir={() => setDoBanco((lista) => lista.filter((x) => x.id !== c.id))}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </PageLayout>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { equipe } from "@/data/mock";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Quem faz o Conexão Pais | Equipe" },
      {
        name: "description",
        content:
          "Conheça as pessoas por trás do Conexão Pais: editoria, conselho técnico, colunistas e educação.",
      },
      { property: "og:title", content: "Equipe | Conexão Pais" },
      {
        property: "og:description",
        content: "As pessoas que cuidam do conteúdo e da comunidade do Conexão Pais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Equipe,
});

function Equipe() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Quem faz"
        title="A equipe por trás do Conexão Pais"
        description="Um grupo pequeno, com experiência clínica, editorial e educacional, que revisa cada conteúdo antes de publicar."
      />

      <section className="section-y mx-auto max-w-6xl px-5">
        <div className="grid gap-6 md:grid-cols-2">
          {equipe.map((p, i) => (
            <article
              key={p.slug}
              className={
                i % 3 === 0
                  ? "rounded-3xl border border-border bg-mint/40 p-8"
                  : "rounded-3xl border border-border bg-card p-8"
              }
            >
              <div className="flex items-start gap-4">
                <span className="blob flex size-16 shrink-0 items-center justify-center bg-primary font-display text-lg text-primary-foreground">
                  {p.iniciais}
                </span>
                <div>
                  <h2 className="font-display text-2xl text-primary">{p.nome}</h2>
                  <p className="text-sm font-medium text-accent">{p.funcao}</p>
                </div>
              </div>
              <p className="mt-5 text-muted-foreground">{p.descricao}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {p.habilidades.map((h) => (
                  <li
                    key={h}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

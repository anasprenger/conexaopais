import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { profissionais } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/profissionais/")({
  head: () => ({
    meta: [
      { title: "Profissionais parceiros | Conexão Pais" },
      {
        name: "description",
        content:
          "Encontre psicólogos, pediatras, pedagogos e terapeutas familiares parceiros do Conexão Pais.",
      },
      { property: "og:title", content: "Profissionais | Conexão Pais" },
      { property: "og:description", content: "Conheça quem pode ajudar sua família." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profissionais,
});

const areas = ["Todas", ...new Set(profissionais.map((p) => p.especialidade))];

function Profissionais() {
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState("Todas");

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return profissionais.filter((p) => {
      const combinaArea = area === "Todas" || p.especialidade === area;
      const combinaBusca =
        termo === "" ||
        p.nome.toLowerCase().includes(termo) ||
        p.especialidade.toLowerCase().includes(termo) ||
        p.descricao.toLowerCase().includes(termo);
      return combinaArea && combinaBusca;
    });
  }, [busca, area]);

  return (
    <PageLayout>
      <PageHero
        eyebrow="Diretório"
        title="Encontre um profissional"
        description="Perfis de profissionais parceiros, com área de atuação, formação e formas de contato."
      />

      <section className="section-y mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-4">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou especialidade..."
            aria-label="Buscar profissionais"
            className="h-11 rounded-full sm:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <Button
                key={a}
                variant={a === area ? "default" : "soft"}
                size="sm"
                onClick={() => setArea(a)}
              >
                {a}
              </Button>
            ))}
          </div>
        </div>

        {resultados.length === 0 ? (
          <p className="mt-12 text-muted-foreground">
            Nenhum profissional encontrado para esta busca.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {resultados.map((p) => (
              <Link
                key={p.slug}
                to="/profissionais/$slug"
                params={{ slug: p.slug }}
                className="group flex gap-5 rounded-3xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
              >
                <div className="blob flex size-16 shrink-0 items-center justify-center bg-mint font-display text-lg text-mint-foreground">
                  {p.iniciais}
                </div>
                <div>
                  <h2 className="font-display text-xl text-primary">{p.nome}</h2>
                  <p className="text-sm font-medium text-accent">{p.especialidade}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Ver perfil
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}

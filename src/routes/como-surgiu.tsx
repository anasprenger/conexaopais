import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";

export const Route = createFileRoute("/como-surgiu")({
  head: () => ({
    meta: [
      { title: "Como surgiu o Conexão Pais | Nossa história" },
      {
        name: "description",
        content:
          "A origem do Conexão Pais: da ideia inicial ao ecossistema digital que aproxima famílias, profissionais e conteúdo de qualidade.",
      },
      { property: "og:title", content: "Como surgiu o Conexão Pais" },
      { property: "og:description", content: "A história por trás do projeto." },
    ],
  }),
  component: ComoSurgiu,
});

const timeline = [
  { fase: "A ideia", texto: "Uma conversa sobre o quanto quem cuida se sente sozinho ao decidir." },
  { fase: "A pesquisa", texto: "Escutamos famílias e profissionais para entender as lacunas." },
  { fase: "O desenvolvimento", texto: "Um portal editorial pensado para crescer por etapas." },
  { fase: "A comunidade", texto: "Espaço para comentar, salvar e conversar com quem entende." },
  { fase: "O futuro", texto: "Mensagens, perfis profissionais verificados e revista digital." },
];

function ComoSurgiu() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Como surgiu"
        title="Começou com uma pergunta: para onde a gente olha quando tem dúvida?"
        description="O projeto nasceu voltado às mães e cresceu para abraçar todas as pessoas que cuidam — pais, avós, responsáveis e profissionais."
      />

      <section className="section-y mx-auto max-w-3xl px-5">
        <ol className="relative border-l border-border pl-8">
          {timeline.map((item) => (
            <li key={item.fase} className="relative pb-12 last:pb-0">
              <span className="absolute -left-[2.35rem] mt-1 size-4 rounded-full bg-accent" />
              <h2 className="font-display text-2xl text-primary">{item.fase}</h2>
              <p className="mt-2 text-muted-foreground">{item.texto}</p>
            </li>
          ))}
        </ol>
      </section>
    </PageLayout>
  );
}
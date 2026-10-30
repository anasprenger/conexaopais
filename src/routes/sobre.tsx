import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import formas from "@/assets/formas-conexao.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o Conexão Pais | Famílias e gerações" },
      {
        name: "description",
        content:
          "Conheça o Conexão Pais: propósito, valores e visão de uma plataforma de informação e acolhimento para quem cuida, educa e acompanha.",
      },
      { property: "og:title", content: "Sobre o Conexão Pais" },
      {
        property: "og:description",
        content: "Propósito, valores e visão do Conexão Pais.",
      },
    ],
  }),
  component: Sobre,
});

const valores = [
  { titulo: "Acolhimento", texto: "Nenhuma família deveria se sentir julgada ao pedir ajuda." },
  { titulo: "Clareza", texto: "Informação organizada, sem jargão e fácil de encontrar." },
  { titulo: "Credibilidade", texto: "Conteúdo produzido e revisado por profissionais." },
  { titulo: "Inclusão", texto: "Muitas configurações familiares, um mesmo cuidado." },
];

function Sobre() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Sobre"
        title="Um ecossistema de informação, acolhimento e conexão"
        description="O Conexão Pais existe para aproximar famílias, responsáveis, profissionais e conhecimento — em um espaço humano, organizado e confiável."
      />

      <section className="section-y mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              Cuidar de alguém é uma tarefa cheia de dúvidas. As respostas existem, mas costumam
              estar espalhadas entre grupos de mensagem, redes sociais e conselhos avulsos.
            </p>
            <p>
              Reunimos conteúdo editorial, colunas assinadas e profissionais em um único lugar, com
              linguagem próxima e curadoria séria — sem transformar cuidado em performance.
            </p>
            <p className="font-display text-2xl text-primary">
              A nossa visão é simples: unir famílias e gerações.
            </p>
          </div>
          <img
            src={formas}
            alt="Formas orgânicas representando conexão entre pessoas"
            loading="lazy"
            width={1400}
            height={800}
            className="rounded-[2rem] object-cover shadow-sm"
          />
        </div>

        <div className="mt-16 rounded-[2rem] border border-border bg-card p-8 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl text-primary">
                É médico, psicólogo ou outro profissional?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Faça parte da rede do Conexão Pais: publique artigos, assine colunas e seja
                encontrado por famílias que procuram cuidado de confiança.
              </p>
            </div>
            <Button variant="cta" size="lg" asChild>
              <Link to="/seja-profissional">Seja um profissional</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {valores.map((v) => (
            <div key={v.titulo} className="rounded-3xl bg-mint/50 p-6">
              <h2 className="font-display text-xl text-primary">{v.titulo}</h2>
              <p className="mt-2 text-sm text-mint-foreground/80">{v.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
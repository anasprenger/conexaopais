import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  alternarInteracao,
  minhasInteracoes,
  ranking,
  rankingComentarios,
} from "@/lib/conteudo";
import { toast } from "sonner";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Bookmark, Heart, ShieldCheck, ChevronDown } from "lucide-react";
import { artigos, colunas } from "@/data/mock";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade de famílias | Conexão Pais" },
      {
        name: "description",
        content:
          "Um espaço para conversar com outras famílias e com profissionais: comentários, conteúdos salvos e trocas mediadas.",
      },
      { property: "og:title", content: "Comunidade | Conexão Pais" },
      {
        property: "og:description",
        content: "Converse, salve conteúdos e participe das trocas entre famílias e profissionais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Comunidade,
});

const recursos = [
  {
    icon: MessageCircle,
    titulo: "Comentários e respostas",
    texto: "Converse sobre cada artigo com outras famílias e com quem escreveu o texto.",
    detalhe:
      "Cada artigo e cada coluna tem um espaço de conversa. Os autores acompanham e respondem as dúvidas mais frequentes.",
  },
  {
    icon: Heart,
    titulo: "Curtidas e reações",
    texto: "Sinalize o que ajudou. Isso orienta as próximas pautas da redação.",
    detalhe:
      "O que recebe mais reações entra na fila de aprofundamento — vira reportagem, coluna ou pauta de revista.",
  },
  {
    icon: Bookmark,
    titulo: "Conteúdos salvos",
    texto: "Guarde artigos e edições da revista para ler quando der tempo.",
    detalhe:
      "Tudo que você salvar fica reunido em Minha conta, inclusive as edições da revista em PDF.",
  },
  {
    icon: ShieldCheck,
    titulo: "Espaço mediado",
    texto: "Moderação ativa, denúncia de conteúdo e regras claras de convivência.",
    detalhe:
      "Nada de diagnóstico pela internet, venda ou julgamento. A moderação é feita pela equipe com apoio do conselho técnico.",
  },
];

const regras = [
  "Fale da sua experiência, sem prescrever para a casa do outro.",
  "Nada de diagnóstico, receita ou venda de serviço nos comentários.",
  "Respeite arranjos familiares diferentes do seu.",
  "Denuncie em vez de responder no mesmo tom.",
];

function tituloDoSlug(slug: string) {
  return (
    artigos.find((a) => a.slug === slug)?.titulo ??
    colunas.find((c) => c.slug === slug)?.nome ??
    slug
  );
}

function Comunidade() {
  const { user } = useAuth();
  const [aberto, setAberto] = useState<string | null>(null);
  const [curtidos, setCurtidos] = useState<string[]>([]);
  const [salvos, setSalvos] = useState<string[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [topCurtidas, setTopCurtidas] = useState<Array<{ publicacao_slug: string; total: number }>>(
    [],
  );
  const [topSalvos, setTopSalvos] = useState<Array<{ publicacao_slug: string; total: number }>>([]);
  const [topComentarios, setTopComentarios] = useState<
    Array<{ id: string; texto: string; autor: string; publicacao_slug: string; total: number }>
  >([]);

  const carregarDestaques = async () => {
    const [c, s, com] = await Promise.all([
      ranking("curtida"),
      ranking("salvo"),
      rankingComentarios(),
    ]);
    setTopCurtidas(c);
    setTopSalvos(s);
    setTopComentarios(com);
  };

  useEffect(() => {
    void carregarDestaques();
  }, []);

  useEffect(() => {
    if (!user) {
      setCurtidos([]);
      setSalvos([]);
      return;
    }
    void minhasInteracoes(user.id).then((dados) => {
      setCurtidos(dados.filter((d) => d.tipo === "curtida").map((d) => d.publicacao_slug));
      setSalvos(dados.filter((d) => d.tipo === "salvo").map((d) => d.publicacao_slug));
    });
  }, [user]);

  const alternar = async (tipo: "curtida" | "salvo", slug: string) => {
    if (!user) {
      toast.error("Entre na sua conta para curtir e salvar conteúdos.");
      return;
    }
    const lista = tipo === "curtida" ? curtidos : salvos;
    const set = tipo === "curtida" ? setCurtidos : setSalvos;
    const ativo = lista.includes(slug);
    await alternarInteracao(user.id, slug, tipo, ativo);
    set(ativo ? lista.filter((s) => s !== slug) : [...lista, slug]);
    void carregarDestaques();
  };

  const enviarPergunta = () => {
    if (!user) {
      toast.error("Entre na sua conta para enviar uma pergunta.");
      return;
    }
    if (pergunta.trim().length < 10) {
      toast.error("Escreva um pouco mais para a equipe entender sua dúvida.");
      return;
    }
    setPergunta("");
    toast.success("Pergunta enviada para a moderação. Em breve alguém responde.");
  };

  return (
    <PageLayout>
      <PageHero
        eyebrow="Comunidade"
        title="Ninguém precisa cuidar sozinho"
        description="A comunidade do Conexão Pais reúne responsáveis e profissionais em conversas calmas, mediadas e sem julgamento."
      />

      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-6 sm:grid-cols-2">
          {recursos.map((r) => {
            const abertoAgora = aberto === r.titulo;
            return (
              <button
                key={r.titulo}
                type="button"
                aria-expanded={abertoAgora}
                onClick={() => setAberto(abertoAgora ? null : r.titulo)}
                className="rounded-3xl border border-border bg-card p-8 text-left transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <r.icon className="size-6 text-accent" aria-hidden />
                  <ChevronDown
                    className={cn(
                      "size-5 text-muted-foreground transition-transform",
                      abertoAgora && "rotate-180",
                    )}
                  />
                </div>
                <h2 className="mt-4 font-display text-xl text-primary">{r.titulo}</h2>
                <p className="mt-2 text-muted-foreground">{r.texto}</p>
                {abertoAgora && (
                  <p className="mt-4 border-t border-border pt-4 text-muted-foreground">
                    {r.detalhe}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-y mx-auto max-w-6xl px-5">
        <h2 className="font-display text-2xl text-primary">Conversas em andamento</h2>
        <p className="mt-2 text-muted-foreground">
          Curta e salve para acompanhar. Toque no título para abrir o conteúdo completo.
        </p>

        <div className="mt-6 space-y-4">
          {artigos.map((a) => (
            <div
              key={a.slug}
              className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-6"
            >
              <div className="min-w-[16rem] flex-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                  {a.categoria} · {a.leitura} de leitura
                </span>
                <Link
                  to="/artigos/$slug"
                  params={{ slug: a.slug }}
                  className="mt-2 block font-display text-xl text-primary hover:underline"
                >
                  {a.titulo}
                </Link>
                <p className="mt-2 text-muted-foreground">{a.resumo}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={curtidos.includes(a.slug) ? "cta" : "soft"}
                  size="sm"
                  onClick={() => void alternar("curtida", a.slug)}
                  aria-pressed={curtidos.includes(a.slug)}
                >
                  <Heart className="size-4" />
                  {curtidos.includes(a.slug) ? "Curtido" : "Curtir"}
                </Button>
                <Button
                  variant={salvos.includes(a.slug) ? "cta" : "soft"}
                  size="sm"
                  onClick={() => void alternar("salvo", a.slug)}
                  aria-pressed={salvos.includes(a.slug)}
                >
                  <Bookmark className="size-4" />
                  {salvos.includes(a.slug) ? "Salvo" : "Salvar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-2xl text-primary">Destaques da comunidade</h2>
        <p className="mt-2 text-muted-foreground">
          O que as famílias mais curtiram, salvaram e comentaram por aqui.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-7">
            <h3 className="font-display text-lg text-primary">Artigos com mais curtidas</h3>
            {topCurtidas.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Ainda sem curtidas. Comece curtindo um conteúdo acima.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {topCurtidas.map((t, i) => (
                  <li key={t.publicacao_slug} className="flex gap-3 text-sm">
                    <span className="font-display text-accent">{i + 1}</span>
                    <span className="flex-1">
                      <Link
                        to="/artigos/$slug"
                        params={{ slug: t.publicacao_slug }}
                        className="text-primary hover:underline"
                      >
                        {tituloDoSlug(t.publicacao_slug)}
                      </Link>
                      <span className="block text-muted-foreground">{t.total} curtidas</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-7">
            <h3 className="font-display text-lg text-primary">Artigos mais salvos</h3>
            {topSalvos.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nada salvo ainda. Guarde um conteúdo para ler depois.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {topSalvos.map((t, i) => (
                  <li key={t.publicacao_slug} className="flex gap-3 text-sm">
                    <span className="font-display text-accent">{i + 1}</span>
                    <span className="flex-1">
                      <Link
                        to="/artigos/$slug"
                        params={{ slug: t.publicacao_slug }}
                        className="text-primary hover:underline"
                      >
                        {tituloDoSlug(t.publicacao_slug)}
                      </Link>
                      <span className="block text-muted-foreground">{t.total} vezes salvo</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-7">
            <h3 className="font-display text-lg text-primary">Comentários mais curtidos</h3>
            {topComentarios.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhum comentário curtido até agora.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {topComentarios.map((c) => (
                  <li key={c.id} className="text-sm">
                    <p className="text-foreground/85">“{c.texto}”</p>
                    <p className="mt-1 text-muted-foreground">
                      {c.autor} · {c.total} curtidas · {tituloDoSlug(c.publicacao_slug)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="section-y mx-auto max-w-6xl px-5 pb-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-mint/50 p-8">
            <h2 className="font-display text-2xl text-primary">Pergunte à equipe</h2>
            <p className="mt-2 text-mint-foreground/80">
              Sua dúvida pode virar resposta na coluna Consultório aberto.
            </p>
            <Textarea
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              rows={4}
              className="mt-5 rounded-2xl bg-card"
              placeholder="Escreva sua pergunta..."
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="cta" size="sm" onClick={enviarPergunta}>
                Enviar pergunta
              </Button>
              {!user && (
                <Button variant="quiet" size="sm" asChild>
                  <Link to="/auth">Entrar para participar</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl text-primary">Regras de convivência</h2>
            <ul className="mt-5 space-y-3 text-muted-foreground">
              {regras.map((r) => (
                <li key={r} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              {colunas.map((c) => (
                <Button key={c.slug} variant="soft" size="sm" asChild>
                  <Link to="/colunas/$slug" params={{ slug: c.slug }}>
                    {c.nome}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="section-y">
          <div className="rounded-3xl bg-primary px-8 py-12 text-primary-foreground">
            <h2 className="max-w-xl font-display text-3xl">Faça parte dessa conexão.</h2>
            <p className="mt-3 max-w-xl text-primary-foreground/80">
              Crie sua conta para comentar, salvar conteúdos e conversar com profissionais.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="cta" asChild>
                <Link to={user ? "/minha-conta" : "/auth"}>
                  {user ? "Ir para minha conta" : "Criar minha conta"}
                </Link>
              </Button>
              <Button variant="quiet" asChild>
                <Link to="/artigos">Conhecer conteúdos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

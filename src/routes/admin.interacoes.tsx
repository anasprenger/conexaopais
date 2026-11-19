import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Download, FileText, Heart, PenLine } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { artigos, colunas, revistas } from "@/data/mock";
import type { PublicacaoDb } from "@/lib/publicacoes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/interacoes")({
  head: () => ({
    meta: [
      { title: "Painel de interações | Conexão Pais" },
      { name: "description", content: "Leituras, downloads e interações dos conteúdos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelInteracoes,
});

type Periodo = "7" | "30" | "tudo";

const periodos: Array<{ id: Periodo; rotulo: string }> = [
  { id: "7", rotulo: "Últimos 7 dias" },
  { id: "30", rotulo: "Últimos 30 dias" },
  { id: "tudo", rotulo: "Desde o início" },
];

type Totais = {
  leituras: number;
  downloads: number;
  curtidas: number;
  salvos: number;
  comentarios: number;
};

const zerado: Totais = { leituras: 0, downloads: 0, curtidas: 0, salvos: 0, comentarios: 0 };

type Linha = Totais & { slug: string; titulo: string; detalhe: string; link: LinkConteudo };

type LinkConteudo =
  | { to: "/artigos/$slug"; slug: string }
  | { to: "/revista/$slug"; slug: string }
  | { to: "/colunas/$slug"; slug: string }
  | null;

/** Lista de conteúdos conhecidos (exemplos do site + publicados no banco), por grupo. */
function montarCatalogo(doBanco: PublicacaoDb[]) {
  const artigosLista: Array<Omit<Linha, keyof Totais>> = [
    ...doBanco
      .filter((p) => p.tipo === "artigo" || p.tipo === "post")
      .map((p) => ({
        slug: p.slug,
        titulo: p.titulo,
        detalhe: p.tipo === "post" ? "Post" : (p.categoria ?? "Artigo"),
        link: { to: "/artigos/$slug", slug: p.slug } as const,
      })),
    ...artigos.map((a) => ({
      slug: a.slug,
      titulo: a.titulo,
      detalhe: `${a.categoria} · exemplo`,
      link: { to: "/artigos/$slug", slug: a.slug } as const,
    })),
  ];

  const revistasLista: Array<Omit<Linha, keyof Totais>> = [
    ...doBanco
      .filter((p) => p.tipo === "revista")
      .map((p) => ({
        slug: p.slug,
        titulo: p.titulo,
        detalhe: new Date(p.created_at).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
        link: { to: "/revista/$slug", slug: p.slug } as const,
      })),
    ...revistas.map((r) => ({
      slug: r.slug,
      titulo: r.titulo,
      detalhe: `Edição ${String(r.edicao).padStart(2, "0")} · exemplo`,
      link: { to: "/revista/$slug", slug: r.slug } as const,
    })),
  ];

  const colunasLista: Array<Omit<Linha, keyof Totais>> = [
    ...colunas.flatMap((c) =>
      c.posts.map((p) => ({
        slug: p.slug,
        titulo: p.titulo,
        detalhe: c.nome,
        link: { to: "/colunas/$slug", slug: c.slug } as const,
      })),
    ),
    ...doBanco
      .filter((p) => p.tipo === "coluna")
      .map((p) => ({
        slug: p.slug,
        titulo: p.titulo,
        detalhe: p.categoria ?? "Coluna",
        link: null,
      })),
  ];

  return { artigosLista, revistasLista, colunasLista };
}

function somar(linhas: Linha[]): Totais {
  return linhas.reduce(
    (acc, l) => ({
      leituras: acc.leituras + l.leituras,
      downloads: acc.downloads + l.downloads,
      curtidas: acc.curtidas + l.curtidas,
      salvos: acc.salvos + l.salvos,
      comentarios: acc.comentarios + l.comentarios,
    }),
    { ...zerado },
  );
}

const numero = (n: number) => n.toLocaleString("pt-BR");

function PainelInteracoes() {
  const navigate = useNavigate();
  const { ehAdmin, carregando, user } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>("30");
  const [totais, setTotais] = useState<Map<string, Totais>>(new Map());
  const [doBanco, setDoBanco] = useState<PublicacaoDb[]>([]);
  const [buscando, setBuscando] = useState(true);

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [user, carregando, navigate]);

  const carregar = useCallback(async (p: Periodo) => {
    setBuscando(true);
    const desde =
      p === "tudo" ? null : new Date(Date.now() - Number(p) * 24 * 60 * 60 * 1000).toISOString();
    const [painel, pubs] = await Promise.all([
      supabase.rpc("painel_interacoes", { _desde: desde }),
      supabase.from("publicacoes").select("*").order("created_at", { ascending: false }),
    ]);
    if (painel.error) toast.error("Não foi possível carregar os números do painel.");
    setTotais(
      new Map(
        (painel.data ?? []).map((l) => [
          l.slug,
          {
            leituras: Number(l.leituras),
            downloads: Number(l.downloads),
            curtidas: Number(l.curtidas),
            salvos: Number(l.salvos),
            comentarios: Number(l.comentarios),
          },
        ]),
      ),
    );
    setDoBanco((pubs.data ?? []) as PublicacaoDb[]);
    setBuscando(false);
  }, []);

  useEffect(() => {
    if (ehAdmin) void carregar(periodo);
  }, [ehAdmin, periodo, carregar]);

  const grupos = useMemo(() => {
    const { artigosLista, revistasLista, colunasLista } = montarCatalogo(doBanco);
    const preencher = (lista: Array<Omit<Linha, keyof Totais>>, ordem: keyof Totais) =>
      lista
        .map((item) => ({ ...item, ...(totais.get(item.slug) ?? zerado) }))
        .sort((a, b) => b[ordem] - a[ordem] || a.titulo.localeCompare(b.titulo, "pt-BR"));
    return {
      artigos: preencher(artigosLista, "leituras"),
      revistas: preencher(revistasLista, "leituras"),
      colunas: preencher(colunasLista, "leituras"),
    };
  }, [doBanco, totais]);

  if (carregando || !user) {
    return (
      <PageLayout>
        <section className="section-y mx-auto max-w-5xl px-5">
          <p className="text-muted-foreground">Carregando...</p>
        </section>
      </PageLayout>
    );
  }

  if (!ehAdmin) {
    return (
      <PageLayout>
        <section className="section-y mx-auto max-w-3xl px-5">
          <h1 className="font-display text-3xl text-primary">Área restrita</h1>
          <p className="mt-3 text-muted-foreground">
            Esta página é da administração do Conexão Pais.
          </p>
          <div className="mt-7">
            <Button variant="cta" asChild>
              <Link to="/">Voltar para o início</Link>
            </Button>
          </div>
        </section>
      </PageLayout>
    );
  }

  const tArtigos = somar(grupos.artigos);
  const tRevistas = somar(grupos.revistas);
  const tColunas = somar(grupos.colunas);

  const cartoes = [
    { rotulo: "Leituras de artigos", valor: tArtigos.leituras, icon: FileText },
    {
      rotulo: "Interações em artigos",
      valor: tArtigos.curtidas + tArtigos.salvos + tArtigos.comentarios,
      icon: Heart,
      nota: `${numero(tArtigos.curtidas)} curtidas · ${numero(tArtigos.salvos)} salvos · ${numero(tArtigos.comentarios)} comentários`,
    },
    { rotulo: "Leituras da revista", valor: tRevistas.leituras, icon: BookOpen },
    { rotulo: "Downloads da revista", valor: tRevistas.downloads, icon: Download },
    { rotulo: "Leituras das colunas", valor: tColunas.leituras, icon: PenLine },
  ];

  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-6xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Administração
        </p>
        <h1 className="mt-3 font-display text-4xl text-primary">Painel de interações</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Leituras e interações dos artigos, leituras e downloads da revista e leituras das colunas.
          Visitantes sem conta também contam; a mesma pessoa conta uma leitura por visita.
        </p>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Período">
          {periodos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p.id)}
              aria-pressed={periodo === p.id}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                periodo === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-surface",
              )}
            >
              {p.rotulo}
            </button>
          ))}
        </div>

        <div
          className={cn("mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5", buscando && "opacity-60")}
          aria-busy={buscando}
        >
          {cartoes.map((c) => (
            <div key={c.rotulo} className="rounded-3xl border border-border bg-card p-6">
              <c.icon className="size-5 text-accent" aria-hidden />
              <p className="mt-4 font-display text-4xl text-primary">{numero(c.valor)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.rotulo}</p>
              {c.nota && <p className="mt-2 text-xs text-muted-foreground">{c.nota}</p>}
            </div>
          ))}
        </div>

        <TabelaGrupo
          titulo="Artigos"
          descricao="Leituras de quem abriu o artigo, curtidas, salvos e comentários."
          linhas={grupos.artigos}
          colunasNum={[
            ["leituras", "Leituras"],
            ["curtidas", "Curtidas"],
            ["salvos", "Salvos"],
            ["comentarios", "Comentários"],
          ]}
          buscando={buscando}
        />

        <TabelaGrupo
          titulo="Revista"
          descricao="Leituras no modo de leitura e downloads do PDF."
          linhas={grupos.revistas}
          colunasNum={[
            ["leituras", "Leituras"],
            ["downloads", "Downloads"],
          ]}
          buscando={buscando}
        />

        <TabelaGrupo
          titulo="Colunas"
          descricao="Cada publicação aberta na página da coluna conta como uma leitura."
          linhas={grupos.colunas}
          colunasNum={[
            ["leituras", "Leituras"],
            ["curtidas", "Curtidas"],
            ["salvos", "Salvos"],
          ]}
          buscando={buscando}
        />

        <p className="mt-10 text-sm text-muted-foreground">
          Leituras e downloads passaram a ser contados em 18/11/2026. Curtidas, salvos e comentários
          incluem o histórico anterior.
        </p>
      </section>
    </PageLayout>
  );
}

function TabelaGrupo({
  titulo,
  descricao,
  linhas,
  colunasNum,
  buscando,
}: {
  titulo: string;
  descricao: string;
  linhas: Linha[];
  colunasNum: Array<[keyof Totais, string]>;
  buscando: boolean;
}) {
  const principal = colunasNum[0]![0];
  const maximo = Math.max(1, ...linhas.map((l) => l[principal]));

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-primary">{titulo}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>

      {linhas.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Nenhum conteúdo publicado ainda.</p>
      ) : (
        <div
          className={cn(
            "mt-5 overflow-x-auto rounded-3xl border border-border bg-card",
            buscando && "opacity-60",
          )}
        >
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th scope="col" className="px-6 py-4 font-semibold">
                  Conteúdo
                </th>
                {colunasNum.map(([chave, rotulo]) => (
                  <th
                    key={chave}
                    scope="col"
                    className={cn(
                      "px-4 py-4 text-right font-semibold",
                      chave === principal && "w-56",
                    )}
                  >
                    {rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.slug} className="border-b border-border last:border-0">
                  <td className="px-6 py-4">
                    {l.link ? (
                      <Link
                        to={l.link.to}
                        params={{ slug: l.link.slug }}
                        className="font-medium text-primary hover:underline"
                      >
                        {l.titulo}
                      </Link>
                    ) : (
                      <span className="font-medium text-primary">{l.titulo}</span>
                    )}
                    <span className="mt-0.5 block text-xs text-muted-foreground">{l.detalhe}</span>
                  </td>
                  {colunasNum.map(([chave, rotulo]) => (
                    <td key={chave} className="px-4 py-4 text-right tabular-nums text-foreground">
                      {chave === principal ? (
                        <span
                          className="flex items-center justify-end gap-3"
                          title={`${rotulo}: ${numero(l[chave])}`}
                        >
                          <span
                            aria-hidden
                            className="h-2 w-32 overflow-hidden rounded-full bg-surface"
                          >
                            <span
                              className="block h-full rounded-full bg-primary/70"
                              style={{ width: `${(l[chave] / maximo) * 100}%` }}
                            />
                          </span>
                          <span className="w-10">{numero(l[chave])}</span>
                        </span>
                      ) : (
                        numero(l[chave])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

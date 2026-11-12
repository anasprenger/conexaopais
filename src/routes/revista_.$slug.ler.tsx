import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { PaginaPdf } from "@/components/revista/PaginaPdf";
import { useIsMobile } from "@/hooks/use-mobile";
import { carregarEdicao, type Edicao } from "@/lib/revista";
import { resolverPdf } from "@/lib/conteudo";
import { cn } from "@/lib/utils";
import { EdicaoNaoEncontrada } from "@/components/revista/EdicaoNaoEncontrada";

/**
 * No celular, como nos stories do Instagram: toque no lado direito avança,
 * no lado esquerdo volta e no meio mostra/esconde o progresso e o botão de voltar.
 * Para inverter os lados, troque para true.
 */
const INVERTER_LADOS_NO_CELULAR = false;

export const Route = createFileRoute("/revista_/$slug/ler")({
  loader: async ({ params }) => ({ revista: await carregarEdicao(params.slug) }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.revista.titulo} | Leitura` : "Leitura | Conexão Pais" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: EdicaoNaoEncontrada,
  component: ModoLeitura,
});

function ModoLeitura() {
  const { revista } = Route.useLoaderData();
  const navigate = useNavigate();
  const celular = useIsMobile();

  const [pagina, setPagina] = useState(1);
  const [animacao, setAnimacao] = useState<"folha-avanca" | "folha-volta" | null>(null);
  const [linkPdf, setLinkPdf] = useState<string | null>(null);
  const [pdfResolvido, setPdfResolvido] = useState(false);
  const [totalPdf, setTotalPdf] = useState(1);
  const [controles, setControles] = useState(true);
  const esconderControles = useRef<number | undefined>(undefined);

  const total = linkPdf ? totalPdf : Math.max(1, revista.paginas.length);
  const progresso = Math.round((pagina / total) * 100);

  const voltarParaSinopse = useCallback(() => {
    void navigate({ to: "/revista/$slug", params: { slug: revista.slug } });
  }, [navigate, revista.slug]);

  useEffect(() => {
    let ativo = true;
    void resolverPdf(revista.pdf).then((url) => {
      if (!ativo) return;
      setLinkPdf(url);
      setPdfResolvido(true);
    });
    return () => {
      ativo = false;
    };
  }, [revista.pdf]);

  // Mostra os controles ao abrir e esconde sozinho depois de alguns segundos.
  const mostrarControlesPorUmTempo = useCallback(() => {
    setControles(true);
    window.clearTimeout(esconderControles.current);
    esconderControles.current = window.setTimeout(() => setControles(false), 3000);
  }, []);

  useEffect(() => {
    if (celular) mostrarControlesPorUmTempo();
    return () => window.clearTimeout(esconderControles.current);
  }, [celular, mostrarControlesPorUmTempo]);

  const irPara = useCallback(
    (destino: number) => {
      const alvo = Math.min(total, Math.max(1, destino));
      setPagina((anterior) => {
        if (alvo === anterior) return anterior;
        if (!celular) {
          setAnimacao(alvo > anterior ? "folha-avanca" : "folha-volta");
          window.setTimeout(() => setAnimacao(null), 620);
        }
        return alvo;
      });
    },
    [celular, total],
  );

  const aoCarregarPdf = useCallback((quantidade: number) => {
    setTotalPdf(quantidade);
    setPagina((atual) => Math.min(atual, quantidade));
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") irPara(pagina + 1);
      if (e.key === "ArrowLeft") irPara(pagina - 1);
      if (e.key === "Escape") voltarParaSinopse();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [irPara, pagina, voltarParaSinopse]);

  // Trava a rolagem da página por trás enquanto o modo leitura está aberto.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  const folha = (
    <Folha
      revista={revista}
      pagina={pagina}
      total={total}
      linkPdf={linkPdf}
      pdfResolvido={pdfResolvido}
      aoCarregarPdf={aoCarregarPdf}
      escuro={celular}
    />
  );

  if (celular) {
    const tocarLado = (lado: "esquerdo" | "direito") => {
      const avancar = INVERTER_LADOS_NO_CELULAR ? lado === "esquerdo" : lado === "direito";
      if (avancar) {
        if (pagina === total) mostrarControlesPorUmTempo();
        else irPara(pagina + 1);
      } else {
        irPara(pagina - 1);
      }
    };

    return (
      <div className="fixed inset-0 z-50 h-dvh touch-manipulation select-none overflow-hidden bg-black">
        <div className="absolute inset-0">{folha}</div>

        {/* zonas de toque */}
        <button
          type="button"
          aria-label={INVERTER_LADOS_NO_CELULAR ? "Avançar uma página" : "Voltar uma página"}
          onClick={() => tocarLado("esquerdo")}
          className="absolute inset-y-0 left-0 z-10 w-[30%]"
        />
        <button
          type="button"
          aria-label={controles ? "Esconder controles" : "Mostrar progresso e botão de voltar"}
          onClick={() => {
            window.clearTimeout(esconderControles.current);
            setControles((visivel) => !visivel);
          }}
          className="absolute inset-y-0 left-[30%] z-10 w-[40%]"
        />
        <button
          type="button"
          aria-label={INVERTER_LADOS_NO_CELULAR ? "Voltar uma página" : "Avançar uma página"}
          onClick={() => tocarLado("direito")}
          className="absolute inset-y-0 right-0 z-10 w-[30%]"
        />

        {/* progresso e voltar, como nos stories */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-3 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-200",
            controles ? "opacity-100" : "opacity-0",
          )}
        >
          <BarraProgresso pagina={pagina} total={total} escuro />
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={voltarParaSinopse}
              tabIndex={controles ? 0 : -1}
              className={cn(
                "flex items-center gap-1.5 rounded-full bg-white/15 py-2 pl-2 pr-4 text-sm font-medium text-white backdrop-blur",
                controles && "pointer-events-auto",
              )}
            >
              <X className="size-4" />
              Sair da leitura
            </button>
            <p className="text-sm text-white/85">
              {pagina} de {total} · {progresso}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <header className="flex h-16 shrink-0 items-center px-4 sm:px-6">
        <Link
          to="/revista/$slug"
          params={{ slug: revista.slug }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </header>

      <main className="relative flex min-h-0 flex-1 items-center justify-center px-20 pb-2">
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => irPara(pagina - 1)}
          disabled={pagina === 1}
          className="absolute left-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card p-3 text-primary shadow-md transition-opacity hover:bg-surface disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="folha-palco flex h-full w-full items-center justify-center">
          <div key={pagina} className={cn("folha flex h-full w-full items-center justify-center", animacao)}>
            {folha}
          </div>
        </div>

        <button
          type="button"
          aria-label="Próxima página"
          onClick={() => irPara(pagina + 1)}
          disabled={pagina === total}
          className="absolute right-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card p-3 text-primary shadow-md transition-opacity hover:bg-surface disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </main>

      <footer className="mx-auto w-full max-w-2xl shrink-0 px-6 pb-5 pt-3">
        <BarraProgresso pagina={pagina} total={total} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Página {pagina} de {total} · use as setas do teclado para virar a página
        </p>
      </footer>
    </div>
  );
}

function BarraProgresso({
  pagina,
  total,
  escuro = false,
}: {
  pagina: number;
  total: number;
  escuro?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, indice) => indice + 1).map((numero) => (
        <span
          key={numero}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            numero <= pagina
              ? escuro
                ? "bg-white"
                : "bg-accent"
              : escuro
                ? "bg-white/30"
                : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function Folha({
  revista,
  pagina,
  total,
  linkPdf,
  pdfResolvido,
  aoCarregarPdf,
  escuro,
}: {
  revista: Edicao;
  pagina: number;
  total: number;
  linkPdf: string | null;
  pdfResolvido: boolean;
  aoCarregarPdf: (quantidade: number) => void;
  escuro: boolean;
}) {
  if (linkPdf) {
    return (
      <PaginaPdf
        url={linkPdf}
        pagina={pagina}
        aoCarregar={aoCarregarPdf}
        ajuste="tela"
        tom={escuro ? "claro" : "escuro"}
      />
    );
  }

  const aviso = cn("grid h-full place-items-center px-8 text-center text-sm", escuro ? "text-white/70" : "text-muted-foreground");
  if (!pdfResolvido) return <div className={aviso}>Carregando edição…</div>;

  const atual = revista.paginas.find((p) => p.numero === pagina) ?? revista.paginas[0];
  if (!atual) return <div className={aviso}>Esta edição ainda não tem páginas para leitura.</div>;

  // Edições sem PDF: página de texto no formato da revista.
  return (
    <div className="flex h-full max-h-full w-full items-center justify-center">
      <article className="flex aspect-[3/4] max-h-full w-full max-w-xl flex-col overflow-y-auto rounded-2xl border border-border bg-elevated p-8 shadow-sm sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{atual.secao}</p>
        <h2 className="mt-5 font-display text-3xl leading-tight text-primary">{atual.titulo}</h2>
        <div className="mt-6 space-y-4 text-muted-foreground">
          {atual.texto.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
        <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
          Página {pagina} de {total}
        </p>
      </article>
    </div>
  );
}

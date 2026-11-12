import { useEffect, useRef, useState } from "react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { cn } from "@/lib/utils";

type PaginaPdfProps = {
  url: string;
  pagina: number;
  aoCarregar: (total: number) => void;
  /**
   * "largura": a página ocupa a largura disponível (pode rolar).
   * "tela": a página inteira cabe no espaço disponível, sem rolar (modo leitura e story).
   */
  ajuste?: "largura" | "tela";
  /** Cor do texto de "carregando" e de erro, para fundos escuros. */
  tom?: "claro" | "escuro";
};

// Guarda o PDF já aberto, para não baixar o arquivo de novo a cada página virada.
const documentos = new Map<string, Promise<PDFDocumentProxy>>();

async function abrirDocumento(url: string) {
  let documento = documentos.get(url);
  if (!documento) {
    documento = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs.getDocument({ url }).promise;
    });
    documento.catch(() => documentos.delete(url));
    documentos.set(url, documento);
  }
  return documento;
}

export function PaginaPdf({
  url,
  pagina,
  aoCarregar,
  ajuste = "largura",
  tom = "escuro",
}: PaginaPdfProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    let cancelarRenderizacao: (() => void) | undefined;

    const desenhar = async () => {
      setCarregando(true);
      setFalhou(false);
      try {
        const documento = await abrirDocumento(url);
        if (!ativo) return;

        aoCarregar(documento.numPages);
        const folha = await documento.getPage(Math.min(pagina, documento.numPages));
        if (!ativo) return;

        // Renderiza na resolução da tela, para o texto ficar nítido no celular.
        const densidade = Math.min(window.devicePixelRatio || 1, 3);
        const viewport = folha.getViewport({ scale: Math.max(1.6, densidade * 1.2) });
        const canvas = canvasRef.current;
        const contexto = canvas?.getContext("2d");
        if (!canvas || !contexto) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const tarefa = folha.render({ canvasContext: contexto, viewport });
        cancelarRenderizacao = () => tarefa.cancel();
        await tarefa.promise;
        if (ativo) setCarregando(false);
      } catch (erro) {
        if (ativo && !(erro instanceof Error && erro.name === "RenderingCancelledException")) {
          setFalhou(true);
          setCarregando(false);
        }
      }
    };

    void desenhar();
    return () => {
      ativo = false;
      cancelarRenderizacao?.();
    };
  }, [aoCarregar, pagina, url]);

  const corAviso = tom === "claro" ? "text-white/70" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "relative",
        ajuste === "largura"
          ? "min-h-[28rem] bg-elevated sm:min-h-[42rem]"
          : "flex h-full w-full items-center justify-center",
      )}
    >
      {carregando && !falhou && (
        <div className={cn("absolute inset-0 grid place-items-center text-sm", corAviso)}>
          Carregando página…
        </div>
      )}
      {falhou ? (
        <div className={cn("absolute inset-0 grid place-items-center px-8 text-center", corAviso)}>
          Não foi possível mostrar esta página. O PDF continua disponível para download na
          página da edição.
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          aria-label={`Página ${pagina} da revista`}
          className={cn(
            "block",
            ajuste === "largura"
              ? "mx-auto h-auto w-full"
              : "h-auto max-h-full w-auto max-w-full shadow-xl",
            carregando && "invisible",
          )}
        />
      )}
    </div>
  );
}

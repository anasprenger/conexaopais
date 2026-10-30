import { useEffect, useRef, useState } from "react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

type PaginaPdfProps = {
  url: string;
  pagina: number;
  aoCarregar: (total: number) => void;
};

export function PaginaPdf({ url, pagina, aoCarregar }: PaginaPdfProps) {
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
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const documento = await pdfjs.getDocument({ url }).promise;
        if (!ativo) return;

        aoCarregar(documento.numPages);
        const folha = await documento.getPage(Math.min(pagina, documento.numPages));
        if (!ativo) return;

        const viewport = folha.getViewport({ scale: 1.6 });
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

  return (
    <div className="relative min-h-[28rem] bg-elevated sm:min-h-[42rem]">
      {carregando && (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          Carregando página…
        </div>
      )}
      {falhou ? (
        <div className="absolute inset-0 grid place-items-center px-8 text-center text-muted-foreground">
          Não foi possível mostrar esta página. O PDF continua disponível para download.
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          aria-label={`Página ${pagina} da revista`}
          className="mx-auto block h-auto w-full"
        />
      )}
    </div>
  );
}
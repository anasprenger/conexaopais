import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { enviarPdfRevista } from "@/lib/conteudo";
import type { Edicao } from "@/lib/revista";

/** Arquivos que estão no storage do Supabase (e não links externos ou da pasta public). */
function estaNoStorage(caminho: string | null) {
  return !!caminho && !caminho.startsWith("http") && !caminho.startsWith("/");
}

/**
 * Botão visível só para a administração: edita título, resumo e PDF de uma edição
 * publicada pelo site. O endereço da edição não muda.
 */
export function BotaoEditarRevista({ revista }: { revista: Edicao }) {
  const { ehAdmin } = useAuth();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState(revista.titulo);
  const [resumo, setResumo] = useState(revista.descricao);
  const [novoPdf, setNovoPdf] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Edições de exemplo não estão no banco, então não têm o que editar.
  if (!ehAdmin || !revista.id) return null;

  const abrir = () => {
    setTitulo(revista.titulo);
    setResumo(revista.descricao);
    setNovoPdf(null);
    setAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("O título não pode ficar vazio.");
      return;
    }
    setSalvando(true);
    try {
      let pdfUrl = revista.pdf;
      if (novoPdf) pdfUrl = await enviarPdfRevista(novoPdf);

      const { error } = await supabase
        .from("publicacoes")
        .update({ titulo: titulo.trim(), resumo: resumo.trim() || null, pdf_url: pdfUrl })
        .eq("id", revista.id!);
      if (error) throw error;

      // O PDF antigo não é mais usado: apaga para não ocupar espaço.
      if (novoPdf && estaNoStorage(revista.pdf) && revista.pdf !== pdfUrl) {
        await supabase.storage.from("revistas").remove([revista.pdf!]);
      }

      toast.success("Edição atualizada.");
      setAberto(false);
      await router.invalidate();
    } catch {
      toast.error("Não foi possível salvar. Confira os campos e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Button variant="quiet" size="sm" onClick={abrir}>
        <Pencil className="size-4" />
        Editar edição
      </Button>

      <Dialog open={aberto} onOpenChange={(v) => !salvando && setAberto(v)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar edição</DialogTitle>
            <DialogDescription>
              As mudanças aparecem na página da edição assim que você salvar. O endereço da
              edição continua o mesmo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="editar-titulo">Título</Label>
              <Input
                id="editar-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editar-resumo">Sinopse</Label>
              <Textarea
                id="editar-resumo"
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                rows={7}
                className="rounded-2xl"
              />
              <p className="text-sm text-muted-foreground">
                Cada linha vira um parágrafo de "Sobre esta edição". Linhas que começam com "-"
                viram os tópicos de "Nesta edição".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editar-pdf">Trocar o PDF (opcional)</Label>
              <Input
                id="editar-pdf"
                type="file"
                accept="application/pdf"
                disabled={salvando}
                onChange={(e) => setNovoPdf(e.target.files?.[0] ?? null)}
                className="h-11 rounded-2xl"
              />
              <p className="text-sm text-muted-foreground">
                {novoPdf
                  ? `O PDF atual será substituído por ${novoPdf.name}.`
                  : "Deixe em branco para manter o PDF atual."}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="quiet"
                onClick={() => setAberto(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="cta" disabled={salvando}>
                {salvando ? (novoPdf ? "Enviando PDF..." : "Salvando...") : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

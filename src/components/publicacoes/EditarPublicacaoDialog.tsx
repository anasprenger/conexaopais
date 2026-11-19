import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { supabase } from "@/integrations/supabase/client";
import { enviarPdfRevista } from "@/lib/conteudo";
import type { PublicacaoDb } from "@/lib/publicacoes";

/** Arquivos que estão no storage do Supabase (e não links externos ou da pasta public). */
function estaNoStorage(caminho: string | null) {
  return !!caminho && !caminho.startsWith("http") && !caminho.startsWith("/");
}

/**
 * Edita uma publicação do banco (artigo, post, coluna ou edição da revista).
 * O endereço (slug) não muda, então links, curtidas e comentários continuam valendo.
 */
export function EditarPublicacaoDialog({
  publicacao,
  aberto,
  aoMudarAberto,
  aoSalvar,
}: {
  publicacao: PublicacaoDb;
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  aoSalvar: (atualizada: PublicacaoDb) => void;
}) {
  const ehRevista = publicacao.tipo === "revista";
  const temCategoria = publicacao.tipo === "artigo" || publicacao.tipo === "coluna";

  const [titulo, setTitulo] = useState(publicacao.titulo);
  const [resumo, setResumo] = useState(publicacao.resumo ?? "");
  const [categoria, setCategoria] = useState(publicacao.categoria ?? "");
  const [conteudo, setConteudo] = useState(publicacao.conteudo ?? "");
  const [novoPdf, setNovoPdf] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Sempre que abrir, parte do que está salvo agora.
  useEffect(() => {
    if (!aberto) return;
    setTitulo(publicacao.titulo);
    setResumo(publicacao.resumo ?? "");
    setCategoria(publicacao.categoria ?? "");
    setConteudo(publicacao.conteudo ?? "");
    setNovoPdf(null);
  }, [aberto, publicacao]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("O título não pode ficar vazio.");
      return;
    }
    setSalvando(true);
    try {
      let pdfUrl = publicacao.pdf_url;
      if (ehRevista && novoPdf) pdfUrl = await enviarPdfRevista(novoPdf);

      const mudancas = {
        titulo: titulo.trim(),
        resumo: resumo.trim() || null,
        categoria: temCategoria ? categoria.trim() || null : publicacao.categoria,
        conteudo: ehRevista ? publicacao.conteudo : conteudo.trim() || null,
        pdf_url: pdfUrl,
      };
      const { error } = await supabase.from("publicacoes").update(mudancas).eq("id", publicacao.id);
      if (error) throw error;

      // O PDF antigo não é mais usado: apaga para não ocupar espaço.
      if (novoPdf && estaNoStorage(publicacao.pdf_url) && publicacao.pdf_url !== pdfUrl) {
        await supabase.storage.from("revistas").remove([publicacao.pdf_url!]);
      }

      toast.success("Publicação atualizada.");
      aoSalvar({ ...publicacao, ...mudancas });
      aoMudarAberto(false);
    } catch {
      toast.error("Não foi possível salvar. Confira os campos e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !salvando && aoMudarAberto(v)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">
            {ehRevista ? "Editar edição" : "Editar publicação"}
          </DialogTitle>
          <DialogDescription>
            As mudanças aparecem no site assim que você salvar. O endereço da página continua o
            mesmo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="editar-pub-titulo">Título</Label>
            <Input
              id="editar-pub-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editar-pub-resumo">{ehRevista ? "Sinopse" : "Resumo"}</Label>
            <Textarea
              id="editar-pub-resumo"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              rows={ehRevista ? 7 : 3}
              className="rounded-2xl"
            />
            {ehRevista && (
              <p className="text-sm text-muted-foreground">
                Cada linha vira um parágrafo de "Sobre esta edição". Linhas que começam com "-"
                viram os tópicos de "Nesta edição".
              </p>
            )}
          </div>

          {temCategoria && (
            <div className="space-y-2">
              <Label htmlFor="editar-pub-categoria">
                {publicacao.tipo === "coluna" ? "Periodicidade" : "Categoria"}
              </Label>
              <Input
                id="editar-pub-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
          )}

          {ehRevista ? (
            <div className="space-y-2">
              <Label htmlFor="editar-pub-pdf">Trocar o PDF (opcional)</Label>
              <Input
                id="editar-pub-pdf"
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="editar-pub-conteudo">Texto</Label>
              <Textarea
                id="editar-pub-conteudo"
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={10}
                className="rounded-2xl"
                placeholder="Separe os parágrafos com uma linha em branco."
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="quiet"
              onClick={() => aoMudarAberto(false)}
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
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { excluirPublicacao } from "@/lib/publicacoes";
import { ocultarConteudo } from "@/lib/ocultos";

type Props = {
  /** Vazio quando é um conteúdo de exemplo que não está no banco. */
  id?: string | undefined;
  slug: string;
  titulo: string;
  tipo: string;
  autorId?: string | undefined;
  /** Conteúdo de exemplo do site: some da lista sem precisar de justificativa. */
  exemplo?: boolean | undefined;
  aoExcluir?: (() => void) | undefined;
};

/** Botão visível só para a administração: remove uma publicação e, quando é de outra
 *  pessoa, exige uma justificativa que fica registrada e é avisada ao autor. */
export function BotaoExcluirPublicacao({
  id,
  slug,
  titulo,
  tipo,
  autorId,
  exemplo,
  aoExcluir,
}: Props) {
  const { user, ehAdmin } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!user) return null;

  const ehExemplo = exemplo === true || !id || !autorId;
  const ehDono = !ehExemplo && autorId === user.id;
  // Conteúdo de exemplo só a administração pode esconder; o resto, o autor ou a administração.
  if (ehExemplo ? !ehAdmin : !ehDono && !ehAdmin) return null;

  const deTerceiro = !ehExemplo && !ehDono;

  const confirmar = async () => {
    const texto = justificativa.trim();
    if (deTerceiro && texto.length < 10) {
      toast.error("Escreva uma justificativa com pelo menos 10 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      if (ehExemplo) {
        await ocultarConteudo({
          tipo,
          slug,
          titulo,
          justificativa: texto,
          adminId: user.id,
        });
      } else {
        await excluirPublicacao({
          id: id!,
          slug,
          titulo,
          tipo,
          autorId: autorId!,
          adminId: user.id,
          justificativa: texto,
          avisarAutor: deTerceiro,
        });
      }
      toast.success(
        deTerceiro
          ? "Publicação excluída. O autor foi avisado com a justificativa."
          : "Publicação excluída.",
      );
      setAberto(false);
      setJustificativa("");
      aoExcluir?.();
    } catch {
      toast.error("Não foi possível excluir esta publicação.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label={`Mais opções de ${titulo}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setAberto(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">
              Excluir “{titulo}”?
            </DialogTitle>
            <DialogDescription>
              {deTerceiro
                ? "Esta publicação é de outra pessoa. Escreva a justificativa — ela será registrada e enviada ao autor."
                : "Esta ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>

          {deTerceiro && (
            <div className="space-y-2">
              <Label htmlFor={`justificativa-${id}`}>Justificativa</Label>
              <Textarea
                id={`justificativa-${id}`}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
                maxLength={800}
                className="rounded-2xl"
                placeholder="Explique o motivo da remoção para o autor."
              />
            </div>
          )}

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="quiet" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="cta" disabled={enviando} onClick={() => void confirmar()}>
              {enviando ? "Excluindo..." : "Excluir publicação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

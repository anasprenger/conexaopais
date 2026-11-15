import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, RotateCcw, Search, ShieldCheck, Stethoscope, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  definirPapelUsuario,
  excluirUsuario,
  listarUsuarios,
  suspenderUsuario,
  type UsuarioAdmin,
} from "@/lib/admin-usuarios.functions";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários | Conexão Pais" },
      { name: "description", content: "Gestão das contas do Conexão Pais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsuarios,
});

type Filtro = "todos" | "admin" | "profissional" | "usuario" | "suspenso";

const rotulosFiltro: Record<Filtro, string> = {
  todos: "Todos",
  admin: "Administração",
  profissional: "Profissionais",
  usuario: "Usuários",
  suspenso: "Suspensos",
};

function tipoPrincipal(u: UsuarioAdmin): "admin" | "profissional" | "usuario" {
  if (u.papeis.includes("admin")) return "admin";
  if (u.papeis.includes("profissional")) return "profissional";
  return "usuario";
}

function data(valor: string | null) {
  if (!valor) return "nunca";
  return new Date(valor).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function AdminUsuarios() {
  const navigate = useNavigate();
  const { ehAdmin, carregando, user } = useAuth();
  const buscarLista = useServerFn(listarUsuarios);
  const definirPapel = useServerFn(definirPapelUsuario);
  const suspender = useServerFn(suspenderUsuario);
  const excluir = useServerFn(excluirUsuario);

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [buscando, setBuscando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] = useState<UsuarioAdmin | null>(null);
  const [confirmacao, setConfirmacao] = useState("");

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [user, carregando, navigate]);

  const carregar = useCallback(async () => {
    setBuscando(true);
    try {
      setUsuarios(await buscarLista());
    } catch {
      toast.error("Não foi possível carregar os usuários.");
    } finally {
      setBuscando(false);
    }
  }, [buscarLista]);

  useEffect(() => {
    if (ehAdmin) void carregar();
  }, [ehAdmin, carregar]);

  const contagem = useMemo(() => {
    const c: Record<Filtro, number> = { todos: usuarios.length, admin: 0, profissional: 0, usuario: 0, suspenso: 0 };
    for (const u of usuarios) {
      c[tipoPrincipal(u)]++;
      if (u.suspenso) c.suspenso++;
    }
    return c;
  }, [usuarios]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtro === "suspenso" ? !u.suspenso : filtro !== "todos" && tipoPrincipal(u) !== filtro) return false;
      return !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo);
    });
  }, [usuarios, busca, filtro]);

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
          <p className="mt-3 text-muted-foreground">Esta página é da administração do Conexão Pais.</p>
          <div className="mt-7">
            <Button variant="cta" asChild>
              <Link to="/">Voltar para o início</Link>
            </Button>
          </div>
        </section>
      </PageLayout>
    );
  }

  const executar = async (id: string, acao: () => Promise<unknown>, sucesso: string) => {
    setOcupado(id);
    try {
      await acao();
      toast.success(sucesso);
      await carregar();
    } catch (erro) {
      const msg = erro instanceof Error && erro.message && !erro.message.startsWith("Unauthorized")
        ? erro.message
        : "Não foi possível concluir. Tente de novo.";
      toast.error(msg);
    } finally {
      setOcupado(null);
    }
  };

  const alternarPapel = (u: UsuarioAdmin, papel: "admin" | "profissional") => {
    const ativo = !u.papeis.includes(papel);
    const nomePapel = papel === "admin" ? "administração" : "profissional";
    void executar(
      u.id,
      () => definirPapel({ data: { userId: u.id, papel, ativo } }),
      ativo ? `${u.nome} agora é ${nomePapel}.` : `${u.nome} deixou de ser ${nomePapel}.`,
    );
  };

  const alternarSuspensao = (u: UsuarioAdmin) => {
    void executar(
      u.id,
      () => suspender({ data: { userId: u.id, suspenso: !u.suspenso } }),
      u.suspenso ? `Conta de ${u.nome} reativada.` : `Conta de ${u.nome} suspensa.`,
    );
  };

  const confirmarExclusao = async () => {
    if (!paraExcluir) return;
    const alvo = paraExcluir;
    await executar(
      alvo.id,
      () => excluir({ data: { userId: alvo.id, confirmacao: "EXCLUIR" } }),
      `Conta de ${alvo.nome} excluída.`,
    );
    setParaExcluir(null);
    setConfirmacao("");
  };

  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-5xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Administração</p>
        <h1 className="mt-3 font-display text-4xl text-primary">Usuários</h1>
        <p className="mt-3 text-muted-foreground">
          Todas as contas do Conexão Pais. Mude o tipo de conta, suspenda ou exclua quando for preciso.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou email"
              aria-label="Buscar por nome ou email"
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {visiveis.length} de {usuarios.length} contas
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(Object.keys(rotulosFiltro) as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={filtro === f}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                filtro === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-surface",
              )}
            >
              {rotulosFiltro[f]} ({contagem[f]})
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {buscando && usuarios.length === 0 && <p className="text-muted-foreground">Carregando usuários...</p>}
          {!buscando && visiveis.length === 0 && (
            <p className="text-muted-foreground">Nenhuma conta encontrada.</p>
          )}
          {visiveis.map((u) => {
            const souEu = u.id === user.id;
            const tipo = tipoPrincipal(u);
            const travado = ocupado === u.id;
            return (
              <article
                key={u.id}
                className={cn(
                  "rounded-3xl border border-border bg-card p-6 transition-opacity",
                  u.suspenso && "bg-surface",
                  travado && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl text-primary">{u.nome}</h2>
                      {souEu && (
                        <span className="rounded-full bg-mint/60 px-2.5 py-0.5 text-xs text-mint-foreground">
                          você
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 break-all text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        tipo === "admin" && "bg-primary text-primary-foreground",
                        tipo === "profissional" && "bg-accent/15 text-accent",
                        tipo === "usuario" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {tipo === "admin" ? "Administração" : tipo === "profissional" ? "Profissional" : "Usuário"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        u.suspenso ? "bg-destructive/10 text-destructive" : "bg-mint/60 text-mint-foreground",
                      )}
                    >
                      {u.suspenso ? "Suspensa" : "Ativa"}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <li>Cadastro em {data(u.criadoEm)}</li>
                  <li>Último acesso: {data(u.ultimoAcesso)}</li>
                  <li>Entra com {u.provedor === "google" ? "Google" : "email e senha"}</li>
                </ul>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant={u.papeis.includes("admin") ? "soft" : "quiet"}
                    size="sm"
                    disabled={travado || (souEu && u.papeis.includes("admin"))}
                    onClick={() => alternarPapel(u, "admin")}
                    title={souEu ? "Você não pode tirar a sua própria permissão" : undefined}
                  >
                    <ShieldCheck className="size-4" />
                    {u.papeis.includes("admin") ? "Tirar da administração" : "Tornar administração"}
                  </Button>
                  <Button
                    variant={u.papeis.includes("profissional") ? "soft" : "quiet"}
                    size="sm"
                    disabled={travado}
                    onClick={() => alternarPapel(u, "profissional")}
                  >
                    <Stethoscope className="size-4" />
                    {u.papeis.includes("profissional") ? "Tirar de profissional" : "Tornar profissional"}
                  </Button>
                  {!souEu && (
                    <>
                      <Button variant="quiet" size="sm" disabled={travado} onClick={() => alternarSuspensao(u)}>
                        {u.suspenso ? <RotateCcw className="size-4" /> : <Ban className="size-4" />}
                        {u.suspenso ? "Reativar conta" : "Suspender conta"}
                      </Button>
                      <Button
                        variant="quiet"
                        size="sm"
                        disabled={travado}
                        onClick={() => {
                          setConfirmacao("");
                          setParaExcluir(u);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Excluir conta
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Dialog
        open={!!paraExcluir}
        onOpenChange={(v) => {
          if (!v && ocupado === null) setParaExcluir(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir a conta de {paraExcluir?.nome}?</DialogTitle>
            <DialogDescription>
              A conta, as publicações, os comentários e os arquivos dessa pessoa são apagados de vez.
              Não dá para desfazer. Se quiser só impedir o acesso, use Suspender conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmar-exclusao">Digite EXCLUIR para confirmar</Label>
            <Input
              id="confirmar-exclusao"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
              className="h-11 rounded-2xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="quiet" onClick={() => setParaExcluir(null)} disabled={ocupado !== null}>
              Cancelar
            </Button>
            <Button
              variant="cta"
              onClick={() => void confirmarExclusao()}
              disabled={confirmacao !== "EXCLUIR" || ocupado !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {ocupado !== null ? "Excluindo..." : "Excluir de vez"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

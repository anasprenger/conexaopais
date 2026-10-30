import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { decideProfessionalProfile, decideProfessionalRequest } from "@/lib/email-actions.functions";

export const Route = createFileRoute("/admin/profissionais")({
  head: () => ({
    meta: [
      { title: "Novos profissionais | Conexão Pais" },
      { name: "description", content: "Verificação de contas profissionais do Conexão Pais." },
      { property: "og:title", content: "Novos profissionais | Conexão Pais" },
      { property: "og:description", content: "Área da administração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProfissionais,
});

type PerfilProf = {
  id: string;
  display_name: string | null;
  bio: string | null;
  profissao: string | null;
  registro_profissional: string | null;
  especialidade: string | null;
  whatsapp: string | null;
  verificacao: string;
  created_at: string;
};

type Resumo = { publicacoes: number; comentarios: number; interacoes: number };

function AdminProfissionais() {
  const navigate = useNavigate();
  const { ehAdmin, carregando, user } = useAuth();
  const [lista, setLista] = useState<PerfilProf[]>([]);
  const [resumos, setResumos] = useState<Record<string, Resumo>>({});
  const [filtro, setFiltro] = useState<"pendente" | "aprovado" | "recusado">("pendente");
  const [buscando, setBuscando] = useState(true);
  const decidirPerfil = useServerFn(decideProfessionalProfile);

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [user, carregando, navigate]);

  const carregar = useCallback(async () => {
    setBuscando(true);
    const { data: papeis } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "profissional");
    const ids = (papeis ?? []).map((p) => p.user_id);
    if (ids.length === 0) {
      setLista([]);
      setBuscando(false);
      return;
    }
    const { data: perfis } = await supabase
      .from("profiles")
      .select(
        "id, display_name, bio, profissao, registro_profissional, especialidade, whatsapp, verificacao, created_at",
      )
      .in("id", ids)
      .order("created_at", { ascending: false });
    setLista(perfis ?? []);

    const [pubs, coments, inters] = await Promise.all([
      supabase.from("publicacoes").select("autor_id").in("autor_id", ids),
      supabase.from("comentarios").select("user_id").in("user_id", ids),
      supabase.from("interacoes").select("user_id").in("user_id", ids),
    ]);
    const mapa: Record<string, Resumo> = {};
    for (const id of ids) mapa[id] = { publicacoes: 0, comentarios: 0, interacoes: 0 };
    for (const p of pubs.data ?? []) if (mapa[p.autor_id]) mapa[p.autor_id]!.publicacoes += 1;
    for (const c of coments.data ?? []) if (mapa[c.user_id]) mapa[c.user_id]!.comentarios += 1;
    for (const i of inters.data ?? []) if (mapa[i.user_id]) mapa[i.user_id]!.interacoes += 1;
    setResumos(mapa);
    setBuscando(false);
  }, []);

  useEffect(() => {
    if (ehAdmin) void carregar();
  }, [ehAdmin, carregar]);

  if (carregando) {
    return (
      <PageLayout>
        <section className="section-y mx-auto max-w-4xl px-5">
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

  const decidir = async (id: string, verificacao: "aprovado" | "recusado") => {
    try {
      await decidirPerfil({ data: { userId: id, status: verificacao } });
    } catch {
      toast.error("Não foi possível atualizar a verificação.");
      return;
    }
    toast.success(verificacao === "aprovado" ? "Profissional aprovado." : "Cadastro recusado.");
    void carregar();
  };

  const visiveis = lista.filter((p) => p.verificacao === filtro);
  const contar = (v: string) => lista.filter((p) => p.verificacao === v).length;

  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-4xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Administração</p>
        <h1 className="mt-3 font-display text-4xl text-primary">Novos profissionais</h1>
        <p className="mt-3 text-muted-foreground">
          Confira profissão, número de registro e atividade antes de liberar o acesso de publicação.
        </p>

        <Solicitacoes aoDecidir={() => void carregar()} />

        <div className="mt-8 flex flex-wrap gap-2">
          {(["pendente", "aprovado", "recusado"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm capitalize transition-colors",
                filtro === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-surface",
              )}
            >
              {f === "pendente" ? "Aguardando" : f === "aprovado" ? "Aprovados" : "Recusados"} (
              {contar(f)})
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {buscando && <p className="text-muted-foreground">Carregando cadastros...</p>}
          {!buscando && visiveis.length === 0 && (
            <p className="text-muted-foreground">Nenhum cadastro nesta situação.</p>
          )}
          {visiveis.map((p) => {
            const r = resumos[p.id];
            return (
              <article key={p.id} className="rounded-3xl border border-border bg-card p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl text-primary">
                      {p.display_name ?? "Sem nome"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.profissao ?? "Profissão não informada"} ·{" "}
                      {p.registro_profissional
                        ? `Registro ${p.registro_profissional}`
                        : "Sem número de registro"}
                    </p>
                    {p.especialidade && (
                      <p className="text-sm text-muted-foreground">{p.especialidade}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-mint/60 px-3 py-1 text-xs font-medium capitalize text-mint-foreground">
                    {p.verificacao}
                  </span>
                </div>

                {p.bio && <p className="mt-4 text-muted-foreground">{p.bio}</p>}

                <ul className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <li>{r?.publicacoes ?? 0} publicações</li>
                  <li>{r?.comentarios ?? 0} comentários</li>
                  <li>{r?.interacoes ?? 0} interações</li>
                  <li>WhatsApp: {p.whatsapp ?? "não informado"}</li>
                </ul>

                <div className="mt-6 flex flex-wrap gap-3">
                  {p.verificacao !== "aprovado" && (
                    <Button variant="cta" size="sm" onClick={() => void decidir(p.id, "aprovado")}>
                      Aprovar acesso
                    </Button>
                  )}
                  {p.verificacao !== "recusado" && (
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => void decidir(p.id, "recusado")}
                    >
                      Recusar
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PageLayout>
  );
}

type Pedido = {
  id: string;
  user_id: string;
  nome_completo: string;
  telefone: string;
  email: string;
  profissao: string;
  registro_profissional: string;
  endereco: string;
  rede_social: string | null;
  foto_url: string | null;
  status: string;
  created_at: string;
};

function Solicitacoes({
  aoDecidir,
}: {
  aoDecidir: () => void;
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [processando, setProcessando] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState<Record<string, string>>({});
  const decidirSolicitacao = useServerFn(decideProfessionalRequest);

  const buscar = useCallback(async () => {
    const { data } = await supabase
      .from("solicitacoes_profissional")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    setPedidos((data as Pedido[] | null) ?? []);
  }, []);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  const decidir = async (p: Pedido, status: "aprovado" | "recusado" | "ajustes_solicitados") => {
    setProcessando(p.id);
    try {
      const observation = ajustes[p.id]?.trim();
      if (status === "ajustes_solicitados" && (!observation || observation.length < 10)) {
        toast.error("Escreva uma orientação com pelo menos 10 caracteres.");
        return;
      }
      await decidirSolicitacao({ data: { requestId: p.id, status, ...(observation ? { observation } : {}) } });

      toast.success(
        status === "aprovado" ? "Profissional aprovado." : status === "ajustes_solicitados" ? "Orientações enviadas." : "Solicitação recusada.",
      );
      await buscar();
      aoDecidir();
    } catch {
      toast.error("Não foi possível concluir a análise.");
    } finally {
      setProcessando(null);
    }
  };

  if (pedidos.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-display text-2xl text-primary">
        Solicitações recebidas ({pedidos.length})
      </h2>
      <div className="mt-5 space-y-4">
        {pedidos.map((p) => (
          <article key={p.id} className="rounded-3xl border border-accent/40 bg-accent/5 p-7">
            <h3 className="font-display text-xl text-primary">{p.nome_completo}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.profissao} · Registro {p.registro_profissional}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              <li>E-mail: {p.email}</li>
              <li>Telefone: {p.telefone}</li>
              <li>Endereço: {p.endereco}</li>
              <li>Rede social: {p.rede_social ?? "não informada"}</li>
              <li>Enviada em {new Date(p.created_at).toLocaleDateString("pt-BR")}</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="cta"
                size="sm"
                disabled={processando === p.id}
                onClick={() => void decidir(p, "aprovado")}
              >
                Aprovar profissional
              </Button>
              <Button
                variant="quiet"
                size="sm"
                disabled={processando === p.id}
                onClick={() => void decidir(p, "recusado")}
              >
                Recusar
              </Button>
            </div>
            <div className="mt-5 space-y-3 border-t border-border pt-5">
              <Textarea
                value={ajustes[p.id] ?? ""}
                onChange={(event) => setAjustes((atual) => ({ ...atual, [p.id]: event.target.value }))}
                maxLength={800}
                rows={3}
                placeholder="Explique quais dados precisam ser corrigidos"
                aria-label={`Orientações para ${p.nome_completo}`}
              />
              <Button
                variant="soft"
                size="sm"
                disabled={processando === p.id}
                onClick={() => void decidir(p, "ajustes_solicitados")}
              >
                Solicitar ajustes
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

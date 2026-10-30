import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { enviarAvatar } from "@/lib/conteudo";
import { submitProfessionalRequest } from "@/lib/email-actions.functions";

export const Route = createFileRoute("/seja-profissional")({
  head: () => ({
    meta: [
      { title: "Seja um profissional | Conexão Pais" },
      {
        name: "description",
        content:
          "Envie sua solicitação para integrar a rede de profissionais do Conexão Pais e publicar conteúdo para famílias.",
      },
      { property: "og:title", content: "Seja um profissional | Conexão Pais" },
      {
        property: "og:description",
        content: "Cadastro de profissionais parceiros do Conexão Pais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SejaProfissional,
});

type Solicitacao = {
  id: string;
  status: string;
  created_at: string;
  observacao_admin: string | null;
};

function SejaProfissional() {
  const navigate = useNavigate();
  const { user, perfil, carregando } = useAuth();
  const [existente, setExistente] = useState<Solicitacao | null>(null);
  const [carregandoPedido, setCarregandoPedido] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [profissao, setProfissao] = useState("");
  const [registro, setRegistro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [redeSocial, setRedeSocial] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const enviarSolicitacao = useServerFn(submitProfessionalRequest);

  useEffect(() => {
    if (!user) {
      setCarregandoPedido(false);
      return;
    }
    setNome((n) => n || perfil?.display_name || "");
    setEmail((e) => e || user.email || "");
    setTelefone((t) => t || perfil?.whatsapp || "");
    void supabase
      .from("solicitacoes_profissional")
      .select("id, status, created_at, observacao_admin")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setExistente(data ?? null);
        setCarregandoPedido(false);
      });
  }, [user, perfil]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEnviando(true);
    try {
      let fotoUrl: string | null = null;
      if (foto) fotoUrl = await enviarAvatar(user.id, foto);

      await enviarSolicitacao({ data: {
        name: nome, phone: telefone, email, profession: profissao,
        registration: registro, address: endereco,
        ...(redeSocial ? { social: redeSocial } : {}),
        ...(fotoUrl ? { photoUrl: fotoUrl } : {}),
      } });

      toast.success("Solicitação enviada! A administração vai analisar seus dados.");
      setExistente({
        id: "novo",
        status: "pendente",
        created_at: new Date().toISOString(),
        observacao_admin: null,
      });
    } catch {
      toast.error("Não foi possível enviar. Confira os campos e tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  if (carregando || carregandoPedido) {
    return (
      <PageLayout>
        <section className="section-y mx-auto max-w-3xl px-5">
          <p className="text-muted-foreground">Carregando...</p>
        </section>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <PageHero
          eyebrow="Profissionais"
          title="Seja um profissional do Conexão Pais"
          description="Para enviar sua solicitação, entre na sua conta ou crie uma gratuitamente."
        />
        <section className="mx-auto max-w-3xl px-5 pb-20">
          <Button variant="cta" onClick={() => void navigate({ to: "/auth" })}>
            Entrar ou cadastrar-se
          </Button>
        </section>
      </PageLayout>
    );
  }

  if (existente) {
    const emAnalise = existente.status === "pendente";
    return (
      <PageLayout>
        <PageHero
          eyebrow="Profissionais"
          title="Sua solicitação"
          description={
            emAnalise
              ? "Recebemos seus dados. A administração está analisando o seu cadastro profissional."
              : "Confira abaixo a situação da sua solicitação."
          }
        />
        <section className="mx-auto max-w-3xl px-5 pb-20">
          <div className="rounded-3xl border border-border bg-card p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Situação: {existente.status}
            </p>
            <p className="mt-3 text-muted-foreground">
              Enviada em {new Date(existente.created_at).toLocaleDateString("pt-BR")}.
              {emAnalise
                ? " Você receberá um aviso assim que a análise terminar."
                : existente.status === "aprovado"
                  ? " Seu acesso de publicação já está liberado."
                  : " Você pode falar com a equipe pelo contato do site."}
            </p>
            {existente.observacao_admin && (
              <p className="mt-4 rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
                {existente.observacao_admin}
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="cta" asChild>
                <Link to="/minha-conta">Ir para minha conta</Link>
              </Button>
              <Button variant="quiet" asChild>
                <Link to="/contato">Falar com a equipe</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHero
        eyebrow="Profissionais"
        title="Seja um profissional do Conexão Pais"
        description="Preencha os dados abaixo. A administração confere o seu registro antes de liberar a publicação de artigos e posts."
      />

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <form onSubmit={enviar} className="space-y-5 rounded-3xl border border-border bg-card p-8">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone / WhatsApp</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                placeholder="(11) 90000-0000"
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profissao">Profissão</Label>
              <Input
                id="profissao"
                value={profissao}
                onChange={(e) => setProfissao(e.target.value)}
                required
                placeholder="Ex.: Psicóloga, Pediatra"
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registro">Número de cadastro profissional</Label>
              <Input
                id="registro"
                value={registro}
                onChange={(e) => setRegistro(e.target.value)}
                required
                placeholder="CRM / CRP / CRN..."
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço onde reside / atende</Label>
            <Textarea
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              required
              rows={2}
              className="rounded-2xl"
              placeholder="Rua, número, bairro, cidade e estado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rede">Rede social</Label>
            <Input
              id="rede"
              value={redeSocial}
              onChange={(e) => setRedeSocial(e.target.value)}
              placeholder="@seuperfil ou link"
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foto">Foto de perfil</Label>
            <Input
              id="foto"
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
              className="h-11 rounded-2xl"
            />
            <p className="text-xs text-muted-foreground">
              A foto entra no seu perfil público de profissional.
            </p>
          </div>

          <Button type="submit" variant="cta" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </form>
      </section>
    </PageLayout>
  );
}

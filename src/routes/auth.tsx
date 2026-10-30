import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta | Conexão Pais" },
      {
        name: "description",
        content:
          "Acesse sua conta do Conexão Pais para salvar conteúdos, comentar e conversar com profissionais.",
      },
      { property: "og:title", content: "Entrar | Conexão Pais" },
      { property: "og:description", content: "Sua conta no Conexão Pais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, carregando } = useAuth();
  const [modo, setModo] = useState<"entrar" | "criar" | "recuperar" | "nova-senha">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipoConta, setTipoConta] = useState<"usuario" | "profissional">("usuario");
  const [profissao, setProfissao] = useState("");
  const [registro, setRegistro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!carregando && user && modo !== "nova-senha") void navigate({ to: "/minha-conta" });
  }, [user, carregando, navigate, modo]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setModo("nova-senha");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Se houver uma conta com este e-mail, você receberá as instruções.");
      } else if (modo === "nova-senha") {
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        toast.success("Senha atualizada.");
        void navigate({ to: "/minha-conta" });
      } else if (modo === "criar") {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/minha-conta`,
            data: {
              display_name: nome,
              tipo_conta: tipoConta,
              ...(tipoConta === "profissional"
                ? { profissao, registro_profissional: registro }
                : {}),
            },
          },
        });
        if (error) throw error;
        toast.success(
          tipoConta === "profissional"
            ? "Conta criada! Nossa equipe vai conferir seu registro profissional antes de liberar as publicações."
            : "Conta criada! Verifique seu e-mail para confirmar.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success("Bem-vindo de volta.");
        void navigate({ to: "/minha-conta" });
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível continuar.");
    } finally {
      setEnviando(false);
    }
  };

  const entrarComGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/minha-conta" });
  };

  return (
    <PageLayout>
      <section className="section-y mx-auto flex max-w-md flex-col px-5">
        <h1 className="font-display text-3xl text-primary">
          {modo === "entrar" ? "Entrar na sua conta" : modo === "criar" ? "Criar minha conta" : modo === "recuperar" ? "Recuperar minha senha" : "Criar nova senha"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Salve conteúdos, participe das conversas e acompanhe as colunas que você segue.
        </p>

        <form onSubmit={enviar} className="mt-8 space-y-4">
          {modo === "criar" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Como podemos te chamar?</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de conta</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["usuario", "Responsável / família"],
                      ["profissional", "Profissional"],
                    ] as const
                  ).map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setTipoConta(valor)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm transition-colors",
                        tipoConta === valor
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-surface",
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              </div>

              {tipoConta === "profissional" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input
                      id="profissao"
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                      required
                      className="h-11 rounded-2xl"
                      placeholder="Ex.: Psicóloga, Pediatra, Pedagoga"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registro">Número de cadastro profissional</Label>
                    <Input
                      id="registro"
                      value={registro}
                      onChange={(e) => setRegistro(e.target.value)}
                      required
                      className="h-11 rounded-2xl"
                      placeholder="Ex.: CRP 07/123456, CRM/RS 12345"
                    />
                    <p className="text-xs text-muted-foreground">
                      Conforme o conselho da sua profissão. A administração confere antes de liberar
                      publicações.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
          {modo !== "nova-senha" && <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-2xl"
            />
          </div>}
          {modo !== "recuperar" && <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-2xl"
            />
          </div>}

          <Button type="submit" variant="cta" className="w-full" disabled={enviando}>
            {enviando ? "Aguarde..." : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : modo === "recuperar" ? "Enviar instruções" : "Salvar nova senha"}
          </Button>
        </form>

        {(modo === "entrar" || modo === "criar") && <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>}

        {(modo === "entrar" || modo === "criar") && <Button variant="soft" className="w-full" onClick={entrarComGoogle}>
          Continuar com o Google
        </Button>}

        {(modo === "entrar" || modo === "criar") && <button
          type="button"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          className="mt-8 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
        >
          {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho uma conta"}
        </button>}
        {modo === "entrar" && (
          <button type="button" onClick={() => setModo("recuperar")} className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
            Esqueci minha senha
          </button>
        )}
        {modo === "recuperar" && (
          <button type="button" onClick={() => setModo("entrar")} className="mt-8 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
            Voltar para entrar
          </button>
        )}
      </section>
    </PageLayout>
  );
}

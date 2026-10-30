import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, PageHero } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/email-actions.functions";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Fale com o Conexão Pais | Contato" },
      {
        name: "description",
        content:
          "Envie uma dúvida, proposta de parceria ou candidatura de profissional para a equipe do Conexão Pais.",
      },
      { property: "og:title", content: "Contato | Conexão Pais" },
      { property: "og:description", content: "Fale com a equipe do Conexão Pais." },
    ],
  }),
  component: Contato,
});

function Contato() {
  const [enviando, setEnviando] = useState(false);
  const enviarMensagem = useServerFn(submitContactMessage);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    setEnviando(true);
    try {
      await enviarMensagem({ data: {
        name: String(dados.get("nome") ?? ""),
        email: String(dados.get("email") ?? ""),
        subject: String(dados.get("assunto") ?? ""),
        message: String(dados.get("mensagem") ?? ""),
        website: String(dados.get("website") ?? ""),
      } });
    } catch {
      setEnviando(false);
      toast.error("Não foi possível enviar sua mensagem. Tente novamente.");
      return;
    }
    setEnviando(false);
    form.reset();
    toast.success("Mensagem enviada", {
      description: "Nossa equipe responde em breve.",
    });
  };

  return (
    <PageLayout>
      <PageHero
        eyebrow="Contato"
        title="Vamos conversar"
        description="Dúvidas, sugestões, parcerias ou interesse em ser um profissional parceiro: escreva para a gente."
      />

      <section className="section-y mx-auto max-w-2xl px-5">
        <form className="space-y-5 rounded-3xl border border-border bg-card p-8" onSubmit={enviar}>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required placeholder="Como podemos te chamar?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required placeholder="voce@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input id="assunto" name="assunto" maxLength={160} placeholder="Como podemos ajudar?" />
          </div>
          <div className="hidden" aria-hidden="true">
            <Label htmlFor="website">Site</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea id="mensagem" name="mensagem" required minLength={10} maxLength={5000} rows={5} placeholder="Escreva sua mensagem..." />
          </div>
          <Button type="submit" variant="cta" size="lg" className="w-full" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar mensagem"}
          </Button>
        </form>
      </section>
    </PageLayout>
  );
}
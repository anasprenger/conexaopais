import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { enviarPdfRevista, gerarSlug, type TipoPublicacao } from "@/lib/conteudo";
import { cn } from "@/lib/utils";
import { FileText, MessageSquarePlus, BookOpen, PenLine } from "lucide-react";

export const Route = createFileRoute("/nova-postagem")({
  head: () => ({
    meta: [
      { title: "Nova postagem | Conexão Pais" },
      { name: "description", content: "Publique artigos, posts, colunas e edições da revista." },
      { property: "og:title", content: "Nova postagem | Conexão Pais" },
      { property: "og:description", content: "Área de publicação do Conexão Pais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovaPostagem,
});

const opcoes: Array<{
  tipo: TipoPublicacao;
  rotulo: string;
  descricao: string;
  icon: typeof FileText;
  somenteAdmin?: boolean;
}> = [
  {
    tipo: "artigo",
    rotulo: "+ Novo artigo",
    descricao: "Texto longo com categoria, para a seção de artigos.",
    icon: FileText,
  },
  {
    tipo: "post",
    rotulo: "+ Novo post",
    descricao: "Publicação curta para a comunidade.",
    icon: MessageSquarePlus,
  },
  {
    tipo: "revista",
    rotulo: "+ Nova revista",
    descricao: "Edição da revista digital, com PDF para download.",
    icon: BookOpen,
    somenteAdmin: true,
  },
  {
    tipo: "coluna",
    rotulo: "+ Nova coluna",
    descricao: "Espaço fixo de autoria com periodicidade própria.",
    icon: PenLine,
    somenteAdmin: true,
  },
];

type Publicacao = {
  id: string;
  tipo: string;
  titulo: string;
  slug: string;
  status: string;
  created_at: string;
};

function NovaPostagem() {
  const navigate = useNavigate();
  const { user, perfil, ehAdmin, ehProfissional, carregando } = useAuth();
  const [tipo, setTipo] = useState<TipoPublicacao | null>(null);
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [enviandoPdf, setEnviandoPdf] = useState(false);
  const [minhas, setMinhas] = useState<Publicacao[]>([]);

  const podePublicar = ehAdmin || (ehProfissional && perfil?.verificacao === "aprovado");

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [user, carregando, navigate]);

  const carregarMinhas = async (userId: string) => {
    const { data } = await supabase
      .from("publicacoes")
      .select("id, tipo, titulo, slug, status, created_at")
      .eq("autor_id", userId)
      .order("created_at", { ascending: false });
    setMinhas(data ?? []);
  };

  useEffect(() => {
    if (user) void carregarMinhas(user.id);
  }, [user]);

  if (carregando || !user) {
    return (
      <PageLayout>
        <section className="section-y mx-auto max-w-3xl px-5">
          <p className="text-muted-foreground">Carregando...</p>
        </section>
      </PageLayout>
    );
  }

  if (!podePublicar) {
    return (
      <PageLayout>
        <section className="section-y mx-auto max-w-3xl px-5">
          <h1 className="font-display text-3xl text-primary">Área de publicação</h1>
          <p className="mt-4 text-muted-foreground">
            {ehProfissional
              ? "Sua conta profissional ainda está em verificação. Assim que a administração confirmar seu registro, você poderá publicar."
              : "Esta área é para profissionais parceiros e para a administração do Conexão Pais."}
          </p>
          <div className="mt-7">
            <Button variant="cta" asChild>
              <Link to="/minha-conta">Voltar para minha conta</Link>
            </Button>
          </div>
        </section>
      </PageLayout>
    );
  }

  const disponiveis = opcoes.filter((o) => ehAdmin || !o.somenteAdmin);

  const subirPdf = async (arquivo: File) => {
    setEnviandoPdf(true);
    try {
      const caminho = await enviarPdfRevista(arquivo);
      setPdfUrl(caminho);
      toast.success("PDF enviado.");
    } catch {
      toast.error("Não foi possível enviar o PDF. Tente novamente.");
    } finally {
      setEnviandoPdf(false);
    }
  };

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo) return;
    setSalvando(true);
    const { error } = await supabase.from("publicacoes").insert({
      tipo,
      slug: `${gerarSlug(titulo)}-${Date.now().toString(36)}`,
      titulo,
      resumo: resumo || null,
      categoria: categoria || null,
      conteudo: tipo === "revista" ? null : conteudo || null,
      pdf_url: pdfUrl || null,
      autor_id: user.id,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível publicar. Confira os campos e tente de novo.");
      return;
    }
    toast.success("Publicado!");
    setTitulo("");
    setResumo("");
    setCategoria("");
    setConteudo("");
    setPdfUrl("");
    setTipo(null);
    void carregarMinhas(user.id);
  };

  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-3xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Publicação</p>
        <h1 className="mt-3 font-display text-4xl text-primary">Nova postagem</h1>
        <p className="mt-3 text-muted-foreground">
          Escolha o formato e escreva. Você pode revisar depois em Minha conta.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {disponiveis.map((o) => (
            <button
              key={o.tipo}
              type="button"
              onClick={() => setTipo(tipo === o.tipo ? null : o.tipo)}
              aria-pressed={tipo === o.tipo}
              className={cn(
                "rounded-3xl border p-6 text-left transition-colors",
                tipo === o.tipo
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card hover:bg-surface",
              )}
            >
              <o.icon className="size-5 text-accent" aria-hidden />
              <span className="mt-3 block font-display text-xl text-primary">{o.rotulo}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{o.descricao}</span>
            </button>
          ))}
        </div>

        {tipo && (
          <form
            onSubmit={publicar}
            className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-8"
          >
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo</Label>
              <Textarea
                id="resumo"
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                rows={2}
                className="rounded-2xl"
              />
            </div>
            {(tipo === "artigo" || tipo === "coluna") && (
              <div className="space-y-2">
                <Label htmlFor="categoria">
                  {tipo === "coluna" ? "Periodicidade" : "Categoria"}
                </Label>
                <Input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="h-11 rounded-2xl"
                  placeholder={tipo === "coluna" ? "Ex.: Quinzenal" : "Ex.: Primeira infância"}
                />
              </div>
            )}
            {tipo === "revista" && (
              <div className="space-y-2">
                <Label htmlFor="pdf-arquivo">PDF da edição</Label>
                <Input
                  id="pdf-arquivo"
                  type="file"
                  accept="application/pdf"
                  disabled={enviandoPdf}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) void subirPdf(arquivo);
                  }}
                  className="h-11 rounded-2xl"
                />
                <p className="text-sm text-muted-foreground">
                  {enviandoPdf
                    ? "Enviando arquivo..."
                    : pdfUrl
                      ? `Arquivo pronto: ${pdfUrl.split("/").pop()}`
                      : "Envie o arquivo em PDF (até 50 MB). Os leitores poderão baixá-lo."}
                </p>
              </div>
            )}
            {tipo !== "revista" && (
              <div className="space-y-2">
                <Label htmlFor="conteudo">Texto</Label>
                <Textarea
                  id="conteudo"
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={10}
                  className="rounded-2xl"
                  placeholder="Escreva separando os parágrafos com uma linha em branco."
                />
              </div>
            )}
            <Button type="submit" variant="cta" disabled={salvando}>
              {salvando ? "Publicando..." : "Publicar"}
            </Button>
          </form>
        )}

        <div className="mt-12">
          <h2 className="font-display text-2xl text-primary">Suas publicações</h2>
          {minhas.length === 0 ? (
            <p className="mt-3 text-muted-foreground">Você ainda não publicou nada por aqui.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {minhas.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-6 py-4"
                >
                  <span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                      {p.tipo}
                    </span>
                    <span className="mt-1 block font-display text-lg text-primary">{p.titulo}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageLayout>
  );
}

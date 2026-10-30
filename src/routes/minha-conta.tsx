import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Papel } from "@/hooks/useAuth";
import { artigos, colunas, revistas } from "@/data/mock";
import { enviarAvatar, minhasInteracoes, resolverAvatar } from "@/lib/conteudo";
import {
  publicacoesDoAutor,
  meusAvisosRemocao,
  type PublicacaoDb,
  type AvisoRemocao,
} from "@/lib/publicacoes";
import { BotaoExcluirPublicacao } from "@/components/admin/BotaoExcluirPublicacao";
import { cn } from "@/lib/utils";
import { deleteMyAccount } from "@/lib/account.functions";
import { Trash2, UserRound } from "lucide-react";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta | Conexão Pais" },
      { name: "description", content: "Gerencie seu perfil no Conexão Pais." },
      { property: "og:title", content: "Minha conta | Conexão Pais" },
      { property: "og:description", content: "Seu perfil no Conexão Pais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MinhaConta,
});

const rotulos: Record<Papel, string> = {
  admin: "Administração",
  profissional: "Profissional parceiro",
  usuario: "Responsável / família",
};

type Aba = "dados" | "publicacoes" | "interacoes" | "lidos" | "salvos";

const abas: Array<{ id: Aba; rotulo: string }> = [
  { id: "dados", rotulo: "Meus dados" },
  { id: "publicacoes", rotulo: "Minhas publicações" },
  { id: "interacoes", rotulo: "Interações" },
  { id: "lidos", rotulo: "Artigos lidos" },
  { id: "salvos", rotulo: "Artigos salvos" },
];

type Interacao = { publicacao_slug: string; tipo: string; created_at: string };

function nomeDoSlug(slug: string) {
  return (
    artigos.find((a) => a.slug === slug)?.titulo ??
    colunas.find((c) => c.slug === slug)?.nome ??
    revistas.find((r) => r.slug === slug)?.titulo ??
    slug
  );
}

function ehArtigo(slug: string) {
  return artigos.some((a) => a.slug === slug);
}

function MinhaConta() {
  const navigate = useNavigate();
  const { user, perfil, papeis, ehAdmin, ehProfissional, carregando, sair, recarregarPerfil } =
    useAuth();
  const [aba, setAba] = useState<Aba>("dados");
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [profissao, setProfissao] = useState("");
  const [registro, setRegistro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [publicacoes, setPublicacoes] = useState<PublicacaoDb[]>([]);
  const [avisos, setAvisos] = useState<AvisoRemocao[]>([]);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState("");
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
  const excluirMinhaConta = useServerFn(deleteMyAccount);

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [user, carregando, navigate]);

  useEffect(() => {
    setNome(perfil?.display_name ?? "");
    setBio(perfil?.bio ?? "");
    setWhatsapp(perfil?.whatsapp ?? "");
    setEspecialidade(perfil?.especialidade ?? "");
    setProfissao(perfil?.profissao ?? "");
    setRegistro(perfil?.registro_profissional ?? "");
    void resolverAvatar(perfil?.avatar_url).then(setAvatar);
  }, [perfil]);

  useEffect(() => {
    if (user) {
      void minhasInteracoes(user.id).then(setInteracoes);
      void publicacoesDoAutor(user.id).then(setPublicacoes);
      void meusAvisosRemocao(user.id).then(setAvisos);
    }
  }, [user]);

  if (carregando || !user) {
    return (
      <PageLayout>
        <section className="section-y mx-auto max-w-3xl px-5">
          <p className="text-muted-foreground">Carregando sua conta...</p>
        </section>
      </PageLayout>
    );
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: nome,
        bio,
        whatsapp: whatsapp.replace(/\D/g, "") || null,
        especialidade: especialidade || null,
        profissao: profissao || null,
        registro_profissional: registro || null,
      })
      .eq("id", user.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar seu perfil.");
      return;
    }
    await recarregarPerfil();
    toast.success("Perfil atualizado.");
  };

  const trocarFoto = async (arquivo: File | null) => {
    if (!arquivo) return;
    setEnviandoFoto(true);
    try {
      const caminho = await enviarAvatar(user.id, arquivo);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: caminho })
        .eq("id", user.id);
      if (error) throw error;
      await recarregarPerfil();
      setAvatar(await resolverAvatar(caminho));
      toast.success("Foto de perfil atualizada.");
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  };

  const excluirConta = async () => {
    if (confirmacaoExclusao !== "EXCLUIR") return;
    setExcluindoConta(true);
    try {
      await excluirMinhaConta({ data: { confirmation: "EXCLUIR" } });
      await sair();
      toast.success("Sua conta e seus conteúdos foram excluídos.");
      void navigate({ to: "/", replace: true });
    } catch {
      setExcluindoConta(false);
      toast.error("Não foi possível excluir sua conta. Tente novamente.");
    }
  };

  const curtidos = interacoes.filter((i) => i.tipo === "curtida");
  const salvos = interacoes.filter((i) => i.tipo === "salvo");
  const lidos = interacoes.filter((i) => i.tipo === "lido");
  const podePublicar = ehAdmin || (ehProfissional && perfil?.verificacao === "aprovado");

  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-3xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Minha conta</p>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <div className="relative">
            <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-mint/60">
              {avatar ? (
                <img src={avatar} alt="Sua foto de perfil" className="size-full object-cover" />
              ) : (
                <UserRound className="size-8 text-mint-foreground" aria-hidden />
              )}
            </span>
          </div>
          <div>
            <h1 className="font-display text-3xl text-primary">
              Olá, {perfil?.display_name ?? "por aqui"}
            </h1>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
            <label className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface">
              {enviandoFoto ? "Enviando..." : "Trocar foto de perfil"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void trocarFoto(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap gap-2">
          {(papeis.length ? papeis : (["usuario"] as Papel[])).map((p) => (
            <li
              key={p}
              className="rounded-full bg-mint/60 px-3 py-1 text-xs font-medium text-mint-foreground"
            >
              {rotulos[p]}
            </li>
          ))}
          {ehProfissional && (
            <li className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium capitalize text-accent">
              Verificação: {perfil?.verificacao ?? "pendente"}
            </li>
          )}
        </ul>

        {podePublicar && (
          <div className="mt-6">
            <Button variant="cta" asChild>
              <Link to="/nova-postagem">+ Nova postagem</Link>
            </Button>
          </div>
        )}

        {ehAdmin && (
          <div className="mt-8 rounded-3xl bg-primary p-8 text-primary-foreground">
            <h2 className="font-display text-2xl">Painel da administração</h2>
            <p className="mt-2 text-primary-foreground/80">
              Verifique novos profissionais, acompanhe interações e publique conteúdos.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="cta" size="sm" asChild>
                <Link to="/admin/profissionais">Novos profissionais</Link>
              </Button>
              <Button variant="quiet" size="sm" asChild>
                <Link to="/comunidade">Moderar comunidade</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-2">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                aba === a.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-surface",
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </div>

        {aba === "dados" && (
          <form
            onSubmit={salvar}
            className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-8"
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome de exibição</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>

            {(ehProfissional || ehAdmin) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="profissao">Profissão</Label>
                  <Input
                    id="profissao"
                    value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Ex.: Psicóloga, Pediatra, Fonoaudióloga"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registro">Número de cadastro profissional</Label>
                  <Input
                    id="registro"
                    value={registro}
                    onChange={(e) => setRegistro(e.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Ex.: CRP 07/123456, CRM/RS 12345"
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe o registro do seu conselho de classe. A administração confere antes de
                    liberar as publicações.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Input
                    id="especialidade"
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Ex.: Psicologia infantil"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp para contato</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="55 51 99999-0000"
                inputMode="tel"
              />
              <p className="text-xs text-muted-foreground">
                Com DDI e DDD. Esse número gera o botão “Enviar mensagem no WhatsApp” do seu perfil
                público.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Sobre você</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="rounded-2xl"
                placeholder="Conte um pouco sobre sua família, se quiser."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="cta" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </Button>
              <Button
                type="button"
                variant="quiet"
                onClick={async () => {
                  await sair();
                  void navigate({ to: "/" });
                }}
              >
                Sair da conta
              </Button>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="font-display text-xl text-foreground">Excluir conta</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Esta ação apaga permanentemente sua conta, publicações, comentários e interações.
              </p>
              <AlertDialog
                open={confirmacaoAberta}
                onOpenChange={(open) => {
                  if (excluindoConta) return;
                  setConfirmacaoAberta(open);
                  if (!open) setConfirmacaoExclusao("");
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="mt-4">
                    <Trash2 aria-hidden />
                    Excluir minha conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-2xl text-foreground">
                      Excluir sua conta definitivamente?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <span className="block">
                        Não será possível recuperar sua conta, publicações, comentários ou
                        interações depois desta ação.
                      </span>
                      <span className="block font-medium text-foreground">
                        Digite EXCLUIR para confirmar.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="confirmar-exclusao">Confirmação</Label>
                    <Input
                      id="confirmar-exclusao"
                      value={confirmacaoExclusao}
                      onChange={(event) => setConfirmacaoExclusao(event.target.value)}
                      autoComplete="off"
                      disabled={excluindoConta}
                      placeholder="EXCLUIR"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={excluindoConta}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={confirmacaoExclusao !== "EXCLUIR" || excluindoConta}
                      onClick={(event) => {
                        event.preventDefault();
                        void excluirConta();
                      }}
                    >
                      {excluindoConta ? "Excluindo..." : "Excluir definitivamente"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        )}

        {aba === "publicacoes" && (
          <div className="mt-6">
            {avisos.length > 0 && (
              <div className="mb-6 space-y-3">
                <h2 className="font-display text-xl text-primary">
                  Publicações removidas pela administração
                </h2>
                {avisos.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-accent/40 bg-accent/10 p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                      {a.tipo} · {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="mt-1 font-display text-lg text-primary">{a.titulo}</p>
                    <p className="mt-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Justificativa: </span>
                      {a.justificativa}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {publicacoes.length === 0 ? (
              <p className="text-muted-foreground">
                Você ainda não publicou nada. Use “+ Nova postagem” para começar.
              </p>
            ) : (
              <ul className="space-y-3">
                {publicacoes.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-6 py-4"
                  >
                    <span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                        {p.tipo} · {p.status}
                      </span>
                      {p.tipo === "artigo" || p.tipo === "post" ? (
                        <Link
                          to="/artigos/$slug"
                          params={{ slug: p.slug }}
                          className="mt-1 block font-display text-lg text-primary hover:underline"
                        >
                          {p.titulo}
                        </Link>
                      ) : (
                        <span className="mt-1 block font-display text-lg text-primary">
                          {p.titulo}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      <BotaoExcluirPublicacao
                        id={p.id}
                        slug={p.slug}
                        titulo={p.titulo}
                        tipo={p.tipo}
                        autorId={p.autor_id}
                        aoExcluir={() =>
                          setPublicacoes((atual) => atual.filter((x) => x.id !== p.id))
                        }
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {aba === "interacoes" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Curtidas", curtidos.length],
                ["Salvos", salvos.length],
                ["Lidos", lidos.length],
              ].map(([rotulo, total]) => (
                <div key={rotulo} className="rounded-3xl bg-mint/50 p-6">
                  <p className="font-display text-3xl text-primary">{total}</p>
                  <p className="text-sm text-mint-foreground/80">{rotulo}</p>
                </div>
              ))}
            </div>
            <ListaInteracoes
              itens={interacoes}
              vazio="Você ainda não interagiu com nenhum conteúdo."
              mostrarTipo
            />
          </div>
        )}

        {aba === "lidos" && (
          <ListaInteracoes
            itens={lidos}
            vazio="Nenhum artigo lido registrado ainda. Abra um artigo até o fim para aparecer aqui."
          />
        )}

        {aba === "salvos" && (
          <ListaInteracoes
            itens={salvos}
            vazio="Você ainda não salvou conteúdos. Use o botão Salvar nos artigos."
          />
        )}
      </section>
    </PageLayout>
  );
}

function ListaInteracoes({
  itens,
  vazio,
  mostrarTipo,
}: {
  itens: Interacao[];
  vazio: string;
  mostrarTipo?: boolean;
}) {
  if (itens.length === 0) {
    return <p className="mt-6 text-muted-foreground">{vazio}</p>;
  }
  return (
    <ul className="mt-6 space-y-3">
      {itens.map((i) => (
        <li
          key={`${i.tipo}-${i.publicacao_slug}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-6 py-4"
        >
          <span>
            {mostrarTipo && (
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                {i.tipo}
              </span>
            )}
            {ehArtigo(i.publicacao_slug) ? (
              <Link
                to="/artigos/$slug"
                params={{ slug: i.publicacao_slug }}
                className="mt-1 block font-display text-lg text-primary hover:underline"
              >
                {nomeDoSlug(i.publicacao_slug)}
              </Link>
            ) : (
              <span className="mt-1 block font-display text-lg text-primary">
                {nomeDoSlug(i.publicacao_slug)}
              </span>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {new Date(i.created_at).toLocaleDateString("pt-BR")}
          </span>
        </li>
      ))}
    </ul>
  );
}

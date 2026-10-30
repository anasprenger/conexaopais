import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Plus, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/como-surgiu", label: "Como surgiu" },
  { to: "/equipe", label: "Equipe" },
  { to: "/profissionais", label: "Profissionais" },
  { to: "/artigos", label: "Artigos" },
  { to: "/revista", label: "Revista" },
  { to: "/colunas", label: "Colunas" },
  { to: "/comunidade", label: "Comunidade" },
  { to: "/contato", label: "Contato" },
] as const;

const titulos: Array<[string, string]> = [
  ["/sobre", "Sobre"],
  ["/como-surgiu", "Como surgiu"],
  ["/equipe", "Equipe"],
  ["/profissionais", "Profissionais"],
  ["/artigos", "Artigos"],
  ["/revista", "Revista"],
  ["/colunas", "Colunas"],
  ["/comunidade", "Comunidade"],
  ["/contato", "Contato"],
  ["/auth", "Entrar"],
  ["/minha-conta", "Minha conta"],
  ["/nova-postagem", "Nova postagem"],
  ["/admin/profissionais", "Novos profissionais"],
];

function tituloDaPagina(pathname: string): string | null {
  const achado = titulos.find(([caminho]) => pathname === caminho || pathname.startsWith(`${caminho}/`));
  return achado ? achado[1] : null;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, perfil, ehAdmin, ehProfissional } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pagina = tituloDaPagina(pathname);
  const podePublicar = ehAdmin || (ehProfissional && perfil?.verificacao === "aprovado");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "border-b border-border bg-background" : "bg-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 transition-all duration-300",
            scrolled ? "h-16" : "h-20",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <Menu className="size-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          <Link
            to="/"
            className="flex min-w-0 items-center justify-center gap-2 font-display text-lg font-semibold leading-none tracking-tight text-primary sm:text-xl"
          >
            <span className={cn(pagina && "hidden sm:inline")}>Conexão Pais</span>
            {pagina && (
              <>
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate font-normal text-foreground/70">{pagina}</span>
              </>
            )}
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {podePublicar && (
              <Button size="sm" asChild>
                <Link to="/nova-postagem">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Nova postagem</span>
                </Link>
              </Button>
            )}
            <Button variant="quiet" size="sm" asChild>
              <Link to={user ? "/minha-conta" : "/auth"}>
                <UserRound className="size-4" />
                <span className="hidden sm:inline">
                  {user ? perfil?.display_name?.split(" ")[0] ?? "Minha conta" : "Entrar"}
                </span>
              </Link>
            </Button>
          </div>

        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          className="absolute inset-0 bg-foreground/50"
          onClick={() => setOpen(false)}
        />
        <nav
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-primary px-8 py-8 text-primary-foreground transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-lg">Conexão Pais</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="rounded-full p-2 transition-colors hover:bg-primary-foreground/10"
            >
              <X className="size-5" />
            </button>
          </div>

          <ul className="no-scrollbar mt-8 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-2 font-display text-xl transition-colors hover:bg-primary-foreground/10"
                  activeProps={{ className: "text-accent" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {podePublicar && (
              <li className="pt-3">
                <Link
                  to="/nova-postagem"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl bg-accent px-4 py-2 font-display text-xl text-accent-foreground transition-opacity hover:opacity-90"
                >
                  + Nova postagem
                </Link>
              </li>
            )}
            {ehAdmin && (
              <li className="pt-1">
                <Link
                  to="/admin/profissionais"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-2 font-display text-xl transition-colors hover:bg-primary-foreground/10"
                >
                  Novos profissionais
                </Link>
              </li>
            )}
            <li className="pt-3">
              <Link
                to={user ? "/minha-conta" : "/auth"}
                onClick={() => setOpen(false)}
                className="block rounded-2xl bg-primary-foreground/10 px-4 py-2 font-display text-xl transition-colors hover:bg-primary-foreground/20"
              >
                {user ? "Minha conta" : "Entrar / Criar conta"}
              </Link>
            </li>
          </ul>

          <p className="mt-auto text-sm text-primary-foreground/70">
            Ajudando a unir famílias e gerações.
          </p>
        </nav>
      </div>
    </>
  );
}

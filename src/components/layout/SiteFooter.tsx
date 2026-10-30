import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl">Conexão Pais</p>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/75">
            Ajudando a unir famílias e gerações. Informação, acolhimento e conexão para quem cuida,
            educa e acompanha.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Navegar</p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li>
              <Link to="/artigos" className="hover:text-accent">
                Artigos
              </Link>
            </li>
            <li>
              <Link to="/colunas" className="hover:text-accent">
                Colunas
              </Link>
            </li>
            <li>
              <Link to="/profissionais" className="hover:text-accent">
                Profissionais
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Projeto</p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li>
              <Link to="/sobre" className="hover:text-accent">
                Sobre
              </Link>
            </li>
            <li>
              <Link to="/como-surgiu" className="hover:text-accent">
                Como surgiu
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-accent">
                Contato
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-6 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Conexão Pais. Todos os direitos reservados.
      </div>
    </footer>
  );
}
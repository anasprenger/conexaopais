import { Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

export function EdicaoNaoEncontrada() {
  return (
    <PageLayout>
      <section className="section-y mx-auto max-w-3xl px-5 text-center">
        <h1 className="font-display text-3xl text-primary">Edição não encontrada</h1>
        <p className="mt-3 text-muted-foreground">
          Talvez esta edição ainda não tenha sido publicada.
        </p>
        <div className="mt-7">
          <Button variant="cta" asChild>
            <Link to="/revista">Ver todas as edições</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}

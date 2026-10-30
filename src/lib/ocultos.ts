import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Oculto = { tipo: string; slug: string };

/** Conteúdos de exemplo que a administração escondeu do site. */
export async function conteudosOcultos(): Promise<Oculto[]> {
  const { data } = await supabase.rpc("public_hidden_content");
  return data ?? [];
}

export async function ocultarConteudo(dados: {
  tipo: string;
  slug: string;
  titulo: string;
  justificativa: string;
  adminId: string;
}) {
  const { error } = await supabase.from("conteudos_ocultos").insert({
    tipo: dados.tipo,
    slug: dados.slug,
    titulo: dados.titulo,
    justificativa: dados.justificativa || null,
    ocultado_por: dados.adminId,
  });
  if (error) throw error;
}

/** Conjunto "tipo:slug" com os conteúdos de exemplo escondidos, para filtrar as listas. */
export function useOcultos() {
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());

  useEffect(() => {
    void conteudosOcultos().then((lista) =>
      setOcultos(new Set(lista.map((o) => `${o.tipo}:${o.slug}`))),
    );
  }, []);

  const esconder = (tipo: string, slug: string) =>
    setOcultos((atual) => new Set(atual).add(`${tipo}:${slug}`));

  const estaOculto = (tipo: string, slug: string) => ocultos.has(`${tipo}:${slug}`);

  return { estaOculto, esconder };
}

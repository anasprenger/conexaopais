import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmail } from "@/lib/email-actions.functions";

type Perfil = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  especialidade: string | null;
  profissao: string | null;
  registro_profissional: string | null;
  verificacao: string;
};

export type Papel = "admin" | "profissional" | "usuario";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  papeis: Papel[];
  ehAdmin: boolean;
  ehProfissional: boolean;
  carregando: boolean;
  sair: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [carregando, setCarregando] = useState(true);

  const buscarPerfil = async (userId: string) => {
    const [{ data: perfilData }, { data: papeisData }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, display_name, bio, avatar_url, whatsapp, especialidade, profissao, registro_profissional, verificacao",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setPerfil(perfilData ?? null);
    setPapeis((papeisData ?? []).map((r) => r.role as Papel));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
      setCarregando(false);
      if (novaSessao?.user) {
        setTimeout(() => void buscarPerfil(novaSessao.user.id), 0);
        if (novaSessao.user.email_confirmed_at) setTimeout(() => void sendWelcomeEmail(), 0);
      } else {
        setPerfil(null);
        setPapeis([]);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
      if (data.session?.user) {
        void buscarPerfil(data.session.user.id);
        if (data.session.user.email_confirmed_at) void sendWelcomeEmail();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    perfil,
    papeis,
    ehAdmin: papeis.includes("admin"),
    ehProfissional: papeis.includes("profissional"),
    carregando,
    sair: async () => {
      await supabase.auth.signOut();
      setPerfil(null);
      setPapeis([]);
    },
    recarregarPerfil: async () => {
      if (session?.user) await buscarPerfil(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}

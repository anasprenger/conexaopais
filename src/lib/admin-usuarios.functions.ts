import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PapelUsuario = "usuario" | "profissional" | "admin";

export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
  papeis: PapelUsuario[];
  suspenso: boolean;
  verificacao: string | null;
  criadoEm: string;
  ultimoAcesso: string | null;
  provedor: string;
};

/** Confere, com o login de quem chamou, se a pessoa é da administração. */
async function exigirAdmin(context: {
  supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null; error: unknown }> };
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Acesso negado");
}

const BANIMENTO_SEM_PRAZO = "876000h"; // cerca de 100 anos: suspensa até ser reativada

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioAdmin[]> => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const contas: User[] = [];
    for (let pagina = 1; pagina <= 20; pagina++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
      if (error) throw new Error("Não foi possível carregar os usuários.");
      contas.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const ids = contas.map((c) => c.id);
    const [{ data: perfis }, { data: papeis }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name, status, verificacao").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    const perfilPorId = new Map((perfis ?? []).map((p) => [p.id, p]));
    const papeisPorId = new Map<string, PapelUsuario[]>();
    for (const r of papeis ?? []) {
      const lista = papeisPorId.get(r.user_id) ?? [];
      lista.push(r.role as PapelUsuario);
      papeisPorId.set(r.user_id, lista);
    }

    return contas
      .map((c) => {
        const perfil = perfilPorId.get(c.id);
        const banidaAte = c.banned_until;
        return {
          id: c.id,
          nome: perfil?.display_name ?? c.email?.split("@")[0] ?? "Sem nome",
          email: c.email ?? "",
          papeis: papeisPorId.get(c.id) ?? [],
          suspenso:
            perfil?.status === "suspenso" || (!!banidaAte && new Date(banidaAte) > new Date()),
          verificacao: perfil?.verificacao ?? null,
          criadoEm: c.created_at,
          ultimoAcesso: c.last_sign_in_at ?? null,
          provedor: (c.app_metadata?.provider as string | undefined) ?? "email",
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  });

const papelSchema = z.object({
  userId: z.string().uuid(),
  papel: z.enum(["profissional", "admin"]),
  ativo: z.boolean(),
});

export const definirPapelUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => papelSchema.parse(input))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context);
    if (data.userId === context.userId && data.papel === "admin" && !data.ativo) {
      throw new Error("Você não pode tirar a sua própria permissão de administração.");
    }

    // Usa o login do admin (e não a chave secreta) para passar pelas regras do banco.
    if (data.ativo) {
      const { error } = await context.supabase
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.papel }, { onConflict: "user_id,role" });
      if (error) throw new Error("Não foi possível alterar o tipo de conta.");
      if (data.papel === "profissional") {
        // Profissional liberado pela administração já fica aprovado para publicar.
        await context.supabase
          .from("profiles")
          .update({
            verificacao: "aprovado",
            verificado_em: new Date().toISOString(),
            verificado_por: context.userId,
          })
          .eq("id", data.userId);
      }
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.papel);
      if (error) throw new Error("Não foi possível alterar o tipo de conta.");
    }
    return { ok: true };
  });

const suspensaoSchema = z.object({
  userId: z.string().uuid(),
  suspenso: z.boolean(),
});

export const suspenderUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => suspensaoSchema.parse(input))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("Você não pode suspender a sua própria conta.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Impede o login (e a renovação da sessão) enquanto estiver suspensa.
    const { error: erroAuth } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspenso ? BANIMENTO_SEM_PRAZO : "none",
    });
    if (erroAuth) throw new Error("Não foi possível alterar a situação da conta.");

    // Tira o perfil das listas públicas (profissionais, autores) enquanto estiver suspensa.
    const { error } = await context.supabase
      .from("profiles")
      .update({ status: data.suspenso ? "suspenso" : "ativo" })
      .eq("id", data.userId);
    if (error) throw new Error("A conta foi bloqueada, mas o perfil não foi atualizado.");
    return { ok: true };
  });

const exclusaoSchema = z.object({
  userId: z.string().uuid(),
  confirmacao: z.literal("EXCLUIR"),
});

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => exclusaoSchema.parse(input))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("Para excluir a sua própria conta, use Minha conta.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { excluirContaComArquivos } = await import("@/lib/excluir-conta.server");
    await excluirContaComArquivos(supabaseAdmin, data.userId);
    return { ok: true };
  });

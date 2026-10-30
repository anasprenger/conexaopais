import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { sendTemplateEmail } from "./email-templates/send-email";

const professionalSchema = z.object({
  name: z.string().trim().min(3).max(120), phone: z.string().trim().min(8).max(30),
  email: z.string().email().max(254), profession: z.string().trim().min(2).max(100),
  registration: z.string().trim().min(2).max(80), address: z.string().trim().min(5).max(300),
  social: z.string().trim().max(200).optional(), photoUrl: z.string().max(500).nullable().optional(),
});

async function safeSend(template: string, recipient: string, templateData: Record<string, unknown>, idempotencyKey: string, replyTo?: string) {
  try { await sendTemplateEmail(template, recipient, { templateData, idempotencyKey, ...(replyTo ? { replyTo } : {}) }); }
  catch (error) { console.error(`[email] ${template} failed`, error instanceof Error ? error.message : String(error)); }
}

export const submitProfessionalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).validator((input) => professionalSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("submit_professional_request", {
      _nome_completo: data.name, _telefone: data.phone, _email: data.email,
      _profissao: data.profession, _registro_profissional: data.registration,
      _endereco: data.address, ...(data.social ? { _rede_social: data.social } : {}), ...(data.photoUrl ? { _foto_url: data.photoUrl } : {}),
    });
    if (error || !id) throw new Error(error?.message ?? "Não foi possível enviar a solicitação.");
    await Promise.all([
      safeSend("solicitacao-profissional-recebida", data.email, { name: data.name, profession: data.profession, requestId: id }, `professional-request-received:${id}`),
      safeSend("admin-novo-profissional", "anasprenger137@gmail.com", { name: data.name, profession: data.profession, registration: data.registration, email: data.email, phone: data.phone, requestId: id }, `admin-professional-request:${id}`, data.email),
    ]);
    return { id };
  });

const decisionSchema = z.object({ requestId: z.string().uuid(), status: z.enum(["aprovado", "recusado", "ajustes_solicitados"]), observation: z.string().trim().max(800).optional() });
export const decideProfessionalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).validator((input) => decisionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("decide_professional_request", { _request_id: data.requestId, _status: data.status, ...(data.observation ? { _observation: data.observation } : {}) });
    if (error) throw new Error(error.message);
    const result = rows?.[0];
    if (!result) throw new Error("Solicitação não encontrada.");
    if (data.status === "aprovado") await safeSend("profissional-aprovado", result.recipient_email, { name: result.recipient_name }, `professional-approved:${data.requestId}`);
    if (data.status === "ajustes_solicitados") await safeSend("profissional-ajustes", result.recipient_email, { name: result.recipient_name, observation: result.observation ?? "Revise os dados informados." }, `professional-adjustments:${data.requestId}:${encodeURIComponent(result.observation ?? "")}`);
    return { status: data.status };
  });

const profileDecisionSchema = z.object({ userId: z.string().uuid(), status: z.enum(["aprovado", "recusado"]) });
export const decideProfessionalProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).validator((input) => profileDecisionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Acesso negado.");
    const { data: profile, error: profileError } = await context.supabase.from("profiles")
      .update({ verificacao: data.status, verificado_em: new Date().toISOString(), verificado_por: context.userId })
      .eq("id", data.userId).select("display_name").single();
    if (profileError) throw new Error(profileError.message);
    if (data.status === "aprovado") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      if (authError) throw new Error(authError.message);
      const email = authData.user?.email;
      if (email) await safeSend("profissional-aprovado", email, { name: profile.display_name ?? undefined }, `professional-profile-approved:${data.userId}`);
    }
    return { status: data.status };
  });

const contactSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().email().max(254), subject: z.string().trim().max(160).optional(), message: z.string().trim().min(10).max(5000), website: z.string().max(0).optional() });
export const submitContactMessage = createServerFn({ method: "POST" }).validator((input) => contactSchema.parse(input)).handler(async ({ data }) => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const client = createClient<Database>(process.env['SUPABASE_URL']!, key, { auth: { persistSession: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); headers.set("apikey", key); return fetch(input, { ...init, headers }); } } });
  const { data: id, error } = await client.rpc("submit_contact_message", { _name: data.name, _email: data.email, _subject: data.subject ?? "", _message: data.message });
  if (error || !id) throw new Error(error?.message ?? "Não foi possível enviar a mensagem.");
  await safeSend("admin-novo-contato", "anasprenger137@gmail.com", { name: data.name, email: data.email, subject: data.subject, message: data.message, messageId: id }, `admin-contact:${id}`, data.email);
  return { id };
});

export const sendWelcomeEmail = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: authData, error: authError } = await context.supabase.auth.getUser();
  if (authError || !authData.user?.email_confirmed_at) return { sent: false };
  const { data: claimed, error } = await context.supabase.rpc("claim_welcome_email");
  if (error || !claimed) return { sent: false };
  const email = authData.user.email ?? "";
  if (!email) return { sent: false };
  const { data: profile } = await context.supabase.from("profiles").select("display_name").eq("id", context.userId).maybeSingle();
  await safeSend("boas-vindas", email, { name: profile?.display_name ?? undefined }, `welcome:${context.userId}`);
  return { sent: true };
});
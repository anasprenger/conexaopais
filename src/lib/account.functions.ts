import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR"),
});

function storagePath(value: string | null | undefined): string | null {
  if (!value || value.startsWith("http") || value.startsWith("/")) return null;
  return value;
}

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => deleteAccountSchema.parse(input))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profile }, { data: publications }, { data: requests }, { data: avatarFiles }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("avatar_url").eq("id", context.userId).maybeSingle(),
        supabaseAdmin
          .from("publicacoes")
          .select("capa_url, pdf_url")
          .eq("autor_id", context.userId),
        supabaseAdmin
          .from("solicitacoes_profissional")
          .select("foto_url")
          .eq("user_id", context.userId),
        supabaseAdmin.storage.from("avatars").list(context.userId, { limit: 1000 }),
      ]);

    const avatarPaths = new Set<string>();
    const profileAvatar = storagePath(profile?.avatar_url);
    if (profileAvatar) avatarPaths.add(profileAvatar);
    for (const file of avatarFiles ?? []) avatarPaths.add(`${context.userId}/${file.name}`);
    for (const request of requests ?? []) {
      const path = storagePath(request.foto_url);
      if (path) avatarPaths.add(path);
    }

    const magazinePaths = new Set<string>();
    for (const publication of publications ?? []) {
      const pdfPath = storagePath(publication.pdf_url);
      if (pdfPath) magazinePaths.add(pdfPath);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (deleteError) throw new Error("Não foi possível excluir sua conta. Tente novamente.");

    const cleanupResults = await Promise.allSettled([
      avatarPaths.size
        ? supabaseAdmin.storage.from("avatars").remove([...avatarPaths])
        : Promise.resolve(),
      magazinePaths.size
        ? supabaseAdmin.storage.from("revistas").remove([...magazinePaths])
        : Promise.resolve(),
    ]);

    for (const result of cleanupResults) {
      if (result.status === "rejected") console.error("[account] storage cleanup failed");
    }

    return { deleted: true };
  });
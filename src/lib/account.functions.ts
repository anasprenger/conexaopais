import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR"),
});

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => deleteAccountSchema.parse(input))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { excluirContaComArquivos } = await import("@/lib/excluir-conta.server");
    await excluirContaComArquivos(supabaseAdmin, context.userId);
    return { deleted: true };
  });

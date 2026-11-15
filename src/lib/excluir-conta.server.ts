// Só roda no servidor: recebe o cliente com a chave secreta do Supabase.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function caminhoNoStorage(valor: string | null | undefined): string | null {
  if (!valor || valor.startsWith("http") || valor.startsWith("/")) return null;
  return valor;
}

/**
 * Exclui a conta de vez e apaga os arquivos dela (foto de perfil e PDFs que publicou).
 * Usado tanto pela própria pessoa (Minha conta) quanto pela administração.
 */
export async function excluirContaComArquivos(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const [{ data: perfil }, { data: publicacoes }, { data: solicitacoes }, { data: avatares }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("avatar_url").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("publicacoes").select("capa_url, pdf_url").eq("autor_id", userId),
      supabaseAdmin.from("solicitacoes_profissional").select("foto_url").eq("user_id", userId),
      supabaseAdmin.storage.from("avatars").list(userId, { limit: 1000 }),
    ]);

  const caminhosAvatar = new Set<string>();
  const avatarDoPerfil = caminhoNoStorage(perfil?.avatar_url);
  if (avatarDoPerfil) caminhosAvatar.add(avatarDoPerfil);
  for (const arquivo of avatares ?? []) caminhosAvatar.add(`${userId}/${arquivo.name}`);
  for (const s of solicitacoes ?? []) {
    const caminho = caminhoNoStorage(s.foto_url);
    if (caminho) caminhosAvatar.add(caminho);
  }

  const caminhosRevista = new Set<string>();
  for (const p of publicacoes ?? []) {
    const caminho = caminhoNoStorage(p.pdf_url);
    if (caminho) caminhosRevista.add(caminho);
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error("Não foi possível excluir a conta. Tente novamente.");

  const limpeza = await Promise.allSettled([
    caminhosAvatar.size
      ? supabaseAdmin.storage.from("avatars").remove([...caminhosAvatar])
      : Promise.resolve(),
    caminhosRevista.size
      ? supabaseAdmin.storage.from("revistas").remove([...caminhosRevista])
      : Promise.resolve(),
  ]);
  for (const r of limpeza) {
    if (r.status === "rejected") console.error("[conta] falha ao apagar arquivos");
  }
}

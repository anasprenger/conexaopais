# Conexão Pais

**Ajudando a unir famílias e gerações.**

Portal editorial e comunidade para famílias: artigos, colunas, revistas em PDF,
perfil de profissionais parceiros e área da comunidade.

- **Site no ar**: https://conexaopais.com.br
- **Feito com**: React + TanStack Start, Tailwind CSS e backend no Lovable Cloud.

## O que tem neste pacote

| Pasta / arquivo | Para que serve |
| --- | --- |
| `src/` | Todo o site: páginas, componentes, estilos e funções de servidor |
| `public/` | Ícones e arquivos que o site entrega (revistas em PDF, robots.txt) |
| `supabase/migrations/` | Histórico das alterações do banco de dados |
| `drizzle/` | Migrações de segurança do banco |
| `package.json` | Lista das bibliotecas usadas pelo site |
| `COMO-SUBIR-NO-GITHUB.md` | Passo a passo para enviar ao GitHub |

## Rodando no seu computador

1. Instale o Node.js (https://nodejs.org) e o Bun (https://bun.sh).
2. Copie `.env.example` para `.env` e preencha os valores do backend.
3. Na pasta do projeto: `bun install` e depois `bun run dev`.

## Importante

- O banco de dados, os usuários, os comentários e os arquivos enviados
  (fotos de perfil e PDFs das revistas) ficam no backend do Lovable Cloud
  e **não** acompanham este pacote.
- Não envie `node_modules`, `.env` nem pastas ocultas do Lovable para o
  repositório — elas ficam de fora do pacote de propósito.

# Como colocar este site no seu repositório do GitHub

1. Extraia o arquivo `conexaopais-site.zip` (clique com o botão direito -> Extrair aqui).
2. Entre no GitHub e abra o repositório `conexaopais`.
3. Clique em **Add file** -> **Upload files**.
4. Arraste **o conteúdo da pasta** (não a pasta em si): `src`, `public`, `supabase`,
   `drizzle`, `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`,
   `eslint.config.js`, `components.json`, `drizzle.config.ts`, `bunfig.toml`,
   `.prettierrc`, `.prettierignore`, `.gitignore`, `README.md`, `AGENTS.md`,
   `roadmap.md` e `.env.example`.
5. Marque **Commit directly to the `main` branch** e clique em **Commit changes**.

## Arquivos que NÃO devem ser enviados
- `node_modules` (pastas grandes geradas automaticamente)
- `.env` (contém as chaves do seu backend — por isso não está no pacote)
- `.git`, `.lovable`, `.workspace` e arquivos `.log`

## Para rodar o site no seu computador
1. Instale o Node.js (https://nodejs.org) e o Bun (https://bun.sh).
2. Renomeie `.env.example` para `.env` e preencha os valores do backend
   (peça a quem cuida do Lovable Cloud).
3. Na pasta do projeto, rode `bun install` e depois `bun run dev`.

## Atenção
- O banco de dados, os usuários e os arquivos enviados ficam no backend do
  Lovable Cloud — eles **não** vão junto neste pacote.
- Se o repositório já estiver ligado ao Lovable (Git sync), qualquer alteração
  feita aqui no editor sobe sozinha; não precisa enviar à mão.

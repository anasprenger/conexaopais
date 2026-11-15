import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Endereço principal do site. Os outros domínios abaixo redirecionam para ele
// (redirecionamento permanente, mantendo a página e os parâmetros da URL).
const DOMINIO_PRINCIPAL = "conexaopais.com";
const DOMINIOS_QUE_REDIRECIONAM = new Set([
  "conexaopais.com.br",
  "www.conexaopais.com.br",
]);

function redirecionarDominio(request: Request): Response | null {
  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = hostHeader.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
  if (!DOMINIOS_QUE_REDIRECIONAM.has(host)) return null;

  const url = new URL(request.url);
  return new Response(null, {
    status: 301,
    headers: { location: `https://${DOMINIO_PRINCIPAL}${url.pathname}${url.search}` },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const redirecionamento = redirecionarDominio(request);
    if (redirecionamento) return redirecionamento;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

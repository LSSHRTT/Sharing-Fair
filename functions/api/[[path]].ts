import { Hono } from "hono";
import { clientInputSchema, clientQuerySchema } from "./lib/schemas";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  listDistinctTags,
} from "./lib/db";
import { jsonOk, jsonError } from "./lib/response";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.get("/health", (c) => jsonOk({ status: "ok", at: new Date().toISOString() }));

app.get("/clients/tags", async (c) => {
  const tags = await listDistinctTags(c.env.DB);
  return jsonOk(tags);
});

app.get("/clients", async (c) => {
  const raw = Object.fromEntries(new URL(c.req.url).searchParams);
  const parsed = clientQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError("Paramètres invalides", 400, parsed.error.flatten());
  }
  const result = await listClients(c.env.DB, parsed.data);
  return jsonOk(result);
});

app.post("/clients", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = clientInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 400, parsed.error.flatten());
  }
  const created = await createClient(c.env.DB, parsed.data);
  return jsonOk(created, 201);
});

app.get("/clients/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return jsonError("ID invalide", 400);
  const client = await getClient(c.env.DB, id);
  if (!client) return jsonError("Client introuvable", 404);
  return jsonOk(client);
});

app.put("/clients/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return jsonError("ID invalide", 400);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = clientInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 400, parsed.error.flatten());
  }
  const updated = await updateClient(c.env.DB, id, parsed.data);
  if (!updated) return jsonError("Client introuvable", 404);
  return jsonOk(updated);
});

app.delete("/clients/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return jsonError("ID invalide", 400);
  const ok = await deleteClient(c.env.DB, id);
  if (!ok) return jsonError("Client introuvable", 404);
  return jsonOk({ id, deleted: true });
});

app.notFound(() => jsonError("Route introuvable", 404));
app.onError((err) => {
  console.error("API error:", err);
  return jsonError("Erreur serveur", 500);
});

export const onRequest: PagesFunction<Bindings> = (ctx) =>
  app.fetch(ctx.request, ctx.env, ctx);

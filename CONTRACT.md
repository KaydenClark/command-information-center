# OpenBrain backend contract

This file documents what Command Information Center (CIC) expects from an OpenBrain-style
RAG backend, so you can build a compatible one. It is the **consumer-side** summary — the
authoritative backend build/schema docs live in the separate OpenBrain backend repository.
This file describes only the surface CIC actually calls.

For Kayden's deployment, OpenBrain owns the authoritative OpenAPI 3.1 contract
at `contracts/query-wiki.openapi.json`; Personal Intelligence Platform runs the
cross-repository compatibility test. This public document remains the portable
human guide for compatible backends and does not make CIC depend on a sibling
file at runtime.

CIC reaches the backend two ways, and uses whichever is configured:

1. **Direct Supabase/Postgres REST** — calls Postgres functions (RPCs) over the Supabase REST
   API with a service-role key, server-side only.
2. **A `query-wiki` edge function** — if `QUERY_WIKI_URL` + `QUERY_WIKI_ACCESS_TOKEN` are set,
   CIC POSTs to that function instead of calling the RPC directly.

All backend calls happen on the server (`server/openbrainClient.js`,
`server/openbrainKeyword.js`, `server/prescientTasks.js`). No backend key ever reaches the browser.

## Environment variables CIC reads

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Base URL of the Supabase project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role (secret) key for server-side RPC calls. `SUPABASE_SECRET_KEY` is accepted as an alias. |
| `QUERY_WIKI_URL` | Optional `query-wiki` edge-function URL. When set (with the token), used instead of direct RPC for semantic search. |
| `QUERY_WIKI_ACCESS_TOKEN` | Bearer token for the `query-wiki` function. |
| `OPENAI_API_KEY` | Used server-side to embed queries (`/embeddings`) and synthesize answers (`/responses`). With Prescient Supabase service-role configuration, current CIC startup also schedules the paid Prescient assessment/writer. |
| `OPENAI_EMBEDDING_MODEL` | Defaults to `text-embedding-3-small`. Must match the embedding model the backend indexed with. |
| `OPENBRAIN_MATCH_COUNT` | Default number of chunks to retrieve (default `8`, server-clamped to 1–20). |
| `OPENBRAIN_MATCH_THRESHOLD` | Default cosine-similarity floor (default `0.2`, clamped to 0–1). |

Semantic retrieval is considered configured when **either** (`QUERY_WIKI_URL` + `QUERY_WIKI_ACCESS_TOKEN`)
**or** (`SUPABASE_URL` + service-role key + `OPENAI_API_KEY`) is present. Keyword retrieval needs
only `SUPABASE_URL` + a service-role key.

## Tables

- **`wiki_documents`** — source documents (the knowledge base). Backed by your ingestion pipeline.
- **`wiki_chunks`** — chunked, embedded slices of `wiki_documents` used for vector search.
  Embeddings are **`text-embedding-3-small`, 1536 dimensions** (a `vector(1536)` column).
- **`prescient_tasks`** — system/user-flagged tasks surfaced on the Intelligence tab. CIC's
  scheduled Prescient assessment reads open system flags and can insert, update,
  or resolve only `flagged_by=system` rows here. Current startup schedules the
  assessment after 10 seconds and every 24 hours when OpenAI and service-role
  configuration are present; this is paid durable-write behavior, not an
  Intelligence page-load read. The schema CIC asks the backend to add is
  included in this repo:
  [`supabase/migrations/20260616045133_create_prescient_tasks.sql`](supabase/migrations/20260616045133_create_prescient_tasks.sql).

> **`vault`** is currently a Postgres enum in the reference backend. Treat it as a generic,
> configurable namespace/label — CIC passes it through as an opaque string (and `null` to mean
> "no filter"). Don't hard-code a specific enum value into a compatible backend.

## RPCs (Postgres functions)

### `match_wiki_chunks` — semantic (vector) search

```sql
match_wiki_chunks(
  query_embedding vector,   -- 1536-dim embedding of the user's query, sent as "[v1,v2,...]"
  match_count     int,      -- max chunks to return
  filter_vault    text,     -- vault namespace, or NULL for no filter
  match_threshold float8    -- minimum cosine similarity
)
```

Returns an array of chunk rows. CIC reads these fields per row: `title`, `vault`, `path`,
`content`, `similarity` (additional fields are ignored). Called from
`server/openbrainClient.js` via `POST {SUPABASE_URL}/rest/v1/rpc/match_wiki_chunks`.

### `search_wiki_keyword` — full-text (keyword) search

```sql
search_wiki_keyword(
  search_text  text,   -- raw query text
  result_count int,    -- max rows
  filter_vault text    -- vault namespace, or NULL
)
RETURNS TABLE(
  document_id text,
  vault       text,
  path        text,
  title       text,
  snippet     text,    -- may contain <b>…</b> highlight tags; CIC strips them
  rank        float    -- relevance score; surfaced as "similarity"
)
```

Used for the fast Intelligence-tab page load (no embedding, no synthesis). Called from
`server/openbrainKeyword.js` via `POST {SUPABASE_URL}/rest/v1/rpc/search_wiki_keyword`.

### Optional: `query-wiki` edge function

If `QUERY_WIKI_URL` is configured, CIC POSTs there (Bearer `QUERY_WIKI_ACCESS_TOKEN`) instead of
calling `match_wiki_chunks` directly:

```http
POST {QUERY_WIKI_URL}
Authorization: Bearer {QUERY_WIKI_ACCESS_TOKEN}
Content-Type: application/json

{ "query": "…", "match_count": 8, "match_threshold": 0.2, "filter_vault": null }
```

Response:

```json
{ "results": [ { "title": "…", "vault": "…", "path": "…", "content": "…", "similarity": 0.83 } ] }
```

The function is expected to embed the query and run the same vector search server-side, returning
the chunk shape above.

## Embeddings

- Model: **`text-embedding-3-small`**
- Dimensions: **1536**
- CIC embeds queries with this model (`server/openbrainClient.js`) before calling
  `match_wiki_chunks`. The backend's stored `wiki_chunks` embeddings must use the same model and
  dimensionality, or similarity scores will be meaningless.

## Synthesis (optional)

When `OPENAI_API_KEY` is set, CIC calls the OpenAI Responses API server-side
(`server/openaiSynthesisClient.js`) to turn retrieved context into answers and overviews. The
retrieved chunks and the local feed are the only grounding context; without a key, CIC returns
deterministic fallbacks built from the feed instead.

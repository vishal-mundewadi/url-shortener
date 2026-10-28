# URL Shortener on Cloudflare Workers

A serverless URL shortener that runs on Cloudflare's global edge network. It exposes a small REST API to create short links and redirects visitors to the original URL, with links stored in Workers KV.

**Live demo:** https://url-shortener.vishal-mundewadi.workers.dev

## Features

- **Create short links** with a single `POST` request.
- **Fast redirects** served from the edge with an HTTP 302 response.
- **Input validation:** rejects malformed JSON, invalid URLs, and any scheme other than `http` or `https`.
- **Random short codes:** 6 characters generated with `crypto.getRandomValues` from an alphabet that leaves out easily confused characters (`0`, `O`, `1`, `l`, `I`).
- **No servers to manage:** a single Worker plus a KV namespace.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Runtime | Cloudflare Workers |
| Storage | Workers KV |
| Tooling | Wrangler CLI |

## API

### `POST /shorten`

Creates a short link.

**Request body**

```json
{ "url": "https://example.com" }
```

**Response: `201 Created`**

```json
{
  "code": "DZwTRj",
  "short_url": "https://url-shortener.vishal-mundewadi.workers.dev/DZwTRj"
}
```

**Errors**

| Status | Cause |
| --- | --- |
| `400` | Body is not valid JSON |
| `400` | `url` is missing or not a valid URL |
| `400` | URL scheme is not `http` or `https` |

### `GET /:code`

Redirects to the original URL with a `302` response. Returns `404` with `{"error": "Not found"}` if the code does not exist.

## Try It

**PowerShell**

```powershell
Invoke-RestMethod -Method Post `
  -Uri https://url-shortener.vishal-mundewadi.workers.dev/shorten `
  -ContentType "application/json" `
  -Body '{"url":"https://example.com"}'
```

**curl**

```bash
curl -X POST https://url-shortener.vishal-mundewadi.workers.dev/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Open the returned `short_url` in a browser to see the redirect.

## Run Locally

**Prerequisites:** Node.js 18 or later and a free Cloudflare account.

```bash
git clone https://github.com/vishal-mundewadi/url-shortener.git
cd url-shortener
npm install
npx wrangler dev
```

The Worker starts at `http://127.0.0.1:8787` and uses a local, simulated KV store, so nothing you create locally touches production data. The included `test.ps1` script sends a sample request to the local server.

## Deploy Your Own

1. Log in to Cloudflare:

   ```bash
   npx wrangler login
   ```

2. Create a KV namespace and let Wrangler add the binding to `wrangler.jsonc`:

   ```bash
   npx wrangler kv namespace create LINKS
   ```

   The binding name must be `LINKS`.

3. Generate types and deploy:

   ```bash
   npx wrangler types
   npx wrangler deploy
   ```

The included `test-live.ps1` script sends a sample request to the deployed Worker. Update the URL inside it to match your own `workers.dev` subdomain.

## Project Structure

```
.
├── src/
│   └── index.ts              # Worker: routing, validation, KV reads and writes
├── test.ps1                  # Sample request against the local dev server
├── test-live.ps1             # Sample request against the deployed Worker
├── wrangler.jsonc            # Worker and KV binding configuration
└── worker-configuration.d.ts # Generated types (npx wrangler types)
```

## How It Works

1. `POST /shorten` parses and validates the submitted URL, generates a random 6-character code, and stores the pair in KV with `env.LINKS.put(code, url)`.
2. `GET /:code` looks the code up with `env.LINKS.get(code)` and returns a 302 redirect, or a 404 if nothing is found.
3. Because the Worker runs at the edge, requests are handled close to the user without any origin server.

## Known Limitations and Roadmap

- Short codes are random and are not checked for collisions before writing. Adding a lookup and retry would make this safe at higher volume.
- Links never expire. KV's expiration TTL option could support optional link expiry.
- There is no rate limiting or authentication on `POST /shorten`.
- Automated tests (for example with Vitest) are not yet added.

## License

MIT

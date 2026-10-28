const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

function makeCode(length = 6): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname, origin } = new URL(request.url);

    if (request.method === "POST" && pathname === "/shorten") {
      let body: { url?: string };
      try {
        body = await request.json();
      } catch {
        return json({ error: "Body must be valid JSON" }, 400);
      }

      let target: URL;
      try {
        target = new URL(body.url ?? "");
      } catch {
        return json({ error: "Invalid URL" }, 400);
      }
      if (target.protocol !== "http:" && target.protocol !== "https:") {
        return json({ error: "Only http and https URLs are allowed" }, 400);
      }

      const code = makeCode();
      await env.LINKS.put(code, target.toString());
      return json({ code, short_url: `${origin}/${code}` }, 201);
    }

    if (request.method === "GET" && pathname.length > 1) {
      const target = await env.LINKS.get(pathname.slice(1));
      if (target) return Response.redirect(target, 302);
      return json({ error: "Not found" }, 404);
    }

    return new Response('POST /shorten with {"url": "https://..."} or GET /<code>');
  },
} satisfies ExportedHandler<Env>;
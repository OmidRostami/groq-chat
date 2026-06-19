// Cloudflare Worker — Anthropic API proxy
// Deploy at: https://dash.cloudflare.com → Workers & Pages → Create Worker

const ALLOWED_ORIGIN = "*"; // or lock to your GitHub Pages URL e.g. "https://yourname.github.io"

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Read the API key from the request header
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing X-API-Key header" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
      });
    }

    // Forward to Anthropic
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await anthropicRes.json();

    return new Response(JSON.stringify(data), {
      status: anthropicRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
    });
  },
};

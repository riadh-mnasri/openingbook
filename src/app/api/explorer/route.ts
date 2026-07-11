import { normalizeFen, toFullFen } from "@/domain/repertoire/fen";

const LICHESS_PARAMS = "variant=standard&speeds=blitz,rapid,classical&ratings=1600,1800,2000,2200";

/**
 * Server-side proxy to the lichess opening explorer, which requires an
 * authenticated request since 2026 (DDoS protection). The personal token
 * stays on the server and responses are cached for a day: opening theory
 * statistics move slowly and lichess asks clients to go easy on the API.
 */
export async function GET(request: Request) {
  const token = process.env.LICHESS_API_TOKEN;
  if (!token) {
    return Response.json(
      { error: "LICHESS_API_TOKEN n'est pas configuré" },
      { status: 501 },
    );
  }

  const params = new URL(request.url).searchParams;
  const source = params.get("source") === "lichess" ? "lichess" : "masters";
  const rawFen = params.get("fen");
  if (!rawFen) return Response.json({ error: "fen est requis" }, { status: 400 });

  let fen: string;
  try {
    fen = toFullFen(normalizeFen(rawFen));
  } catch {
    return Response.json({ error: "fen invalide" }, { status: 400 });
  }

  const encoded = encodeURIComponent(fen);
  const upstream =
    source === "masters"
      ? `https://explorer.lichess.ovh/masters?fen=${encoded}&moves=12&topGames=0`
      : `https://explorer.lichess.ovh/lichess?${LICHESS_PARAMS}&fen=${encoded}&moves=12&topGames=0`;

  const response = await fetch(upstream, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 86400 },
  });
  if (!response.ok) {
    return Response.json({ error: `lichess: HTTP ${response.status}` }, { status: response.status });
  }
  return Response.json(await response.json(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}

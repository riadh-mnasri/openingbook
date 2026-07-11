export function errorResponse(error: unknown, status = 400): Response {
  const message = error instanceof Error ? error.message : "Erreur inattendue";
  return Response.json({ error: message }, { status });
}

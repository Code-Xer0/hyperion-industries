const ALLOWED_METADATA_KEYS = new Set([
  "request_id",
  "route",
  "method",
  "status",
  "duration_ms",
  "reason",
  "model",
  "message_count",
  "input_chars",
  "response_bytes",
  "corpus_entries",
  "notification",
  "purged_rows",
  "purged_grants",
  "purged_drafts",
  "purged_submissions",
  "classification",
  "primary_route",
  "outbox_state",
]);

type MetadataValue = string | number | boolean | null | undefined;

export function logMetadata(event: string, metadata: Record<string, MetadataValue> = {}): void {
  const safe: Record<string, Exclude<MetadataValue, undefined>> = { event };
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined && ALLOWED_METADATA_KEYS.has(key)) safe[key] = value;
  }
  console.info(JSON.stringify(safe));
}

export function errorCategory(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") return "aborted";
  if (error instanceof TypeError) return "type_error";
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  return "unexpected_error";
}

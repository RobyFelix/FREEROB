// Endpoint diagnostico temporaneo: presenza (non valori) delle env vars
export default function handler(req, res) {
  const names = [
    "QSTASH_URL",
    "QSTASH_TOKEN",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "FZ_USER",
    "FZ_PASS",
  ];
  const out = {};
  for (const n of names) out[n] = Boolean(process.env[n]);
  // Cerco anche nomi "simili" per intercettare refusi
  out._similar = Object.keys(process.env).filter((k) =>
    /STASH|REDIS|UPSTASH/i.test(k)
  );
  res.status(200).json(out);
}

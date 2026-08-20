// FreeROB - utilità condivise: Redis (Upstash REST) e QStash

const RURL = process.env.UPSTASH_REDIS_REST_URL;
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN;
const QTOK = process.env.QSTASH_TOKEN;
const QURL = process.env.QSTASH_URL || "https://qstash.upstash.io";

export function envOk() {
  return Boolean(RURL && RTOK && QTOK);
}

export async function redis(cmd) {
  // cmd = array, es. ["SET","chiave","valore"]
  const r = await fetch(RURL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RTOK}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  const data = await r.json();
  if (data.error) throw new Error(`Redis: ${data.error}`);
  return data.result;
}

const KEY = "freerob:seq";

export async function getState() {
  const raw = await redis(["GET", KEY]);
  if (!raw) return { active: false, sent: 0, total: 12, messageIds: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { active: false, sent: 0, total: 12, messageIds: [] };
  }
}

export async function setState(state) {
  await redis(["SET", KEY, JSON.stringify(state)]);
}

export async function qstashPublish(destUrl, delaySeconds) {
  const r = await fetch(
    `${QURL}/v2/publish/${encodeURIComponent(destUrl)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QTOK}`,
        "Upstash-Delay": `${delaySeconds}s`,
        "Content-Type": "application/json",
      },
      body: "{}",
    }
  );
  const data = await r.json();
  if (!r.ok) throw new Error(`QStash: ${JSON.stringify(data).slice(0, 120)}`);
  return data.messageId || (Array.isArray(data) ? data[0]?.messageId : null);
}

export async function qstashCancel(messageId) {
  try {
    await fetch(`${QURL}/v2/messages/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${QTOK}` },
    });
  } catch {
    /* già consegnato o inesistente: ok */
  }
}

export function baseUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `https://${host}`;
}

export async function fireMist(req) {
  const r = await fetch(`${baseUrl(req)}/api/freezanz?action=mist`);
  const data = await r.json().catch(() => ({}));
  return data.success && String(data.response).trim() === "1";
}

// FreeROB – proxy serverless verso myfreezanz.it
// Env vars richieste su Vercel: FZ_USER, FZ_PASS
// Opzionale: FZ_MATRICOLA (default 07641)

const BASE = "https://www.myfreezanz.it/new";
const LOGIN_PAGE = `${BASE}/login/`;
const LOGIN_URL = `${BASE}/login/usercheck.php`;
const DATA_URL = `${BASE}/cliente/include/dataCliente.php`;

const HEADERS_BASE = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
  Origin: "https://www.myfreezanz.it",
  Referer: `${BASE}/cliente/`,
};

// op=8 = ciclo manuale per zona
const ACTIONS = {
  zanzare: { op: "8", numeroZone: "2" }, // Repellente zanzare (Prodotto 2)
  mosche: { op: "8", numeroZone: "3" }, // Repellente mosche  (Prodotto 3)
  profumo: { op: "8", numeroZone: "4" }, // Profumazione Menta (Prodotto 4)
  stop: { op: "2" }, // riserva: non esposto in UI 0.1
  status: { op: "3" },
};

function parseCookies(res, jar) {
  const set = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")].filter(Boolean);
  for (const c of set) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export default async function handler(req, res) {
  const action = (req.query.action || "").toLowerCase();
  if (!ACTIONS[action]) {
    return res
      .status(400)
      .json({ success: false, error: "Azione non valida" });
  }

  const user = process.env.FZ_USER;
  const pass = process.env.FZ_PASS;
  const matricola = process.env.FZ_MATRICOLA || "07641";
  if (!user || !pass) {
    return res.status(500).json({
      success: false,
      error: "Configurare FZ_USER e FZ_PASS nelle env vars Vercel",
    });
  }

  const jar = {};
  try {
    // 1. Cookie di sessione dalla pagina di login
    const r1 = await fetch(LOGIN_PAGE, { headers: HEADERS_BASE });
    parseCookies(r1, jar);

    // 2. Login
    const loginBody = new URLSearchParams({
      ajax: "1",
      username: user,
      password: pass,
    });
    const r2 = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        ...HEADERS_BASE,
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: cookieHeader(jar),
        Referer: LOGIN_PAGE,
      },
      body: loginBody.toString(),
    });
    parseCookies(r2, jar);
    const loginText = await r2.text();

    // 3. Verifica accesso area cliente
    const r3 = await fetch(`${BASE}/cliente/`, {
      headers: { ...HEADERS_BASE, Cookie: cookieHeader(jar) },
      redirect: "follow",
    });
    parseCookies(r3, jar);
    if (r3.url.includes("login")) {
      return res.status(401).json({
        success: false,
        error: "Login fallito",
        debug: loginText.slice(0, 200),
      });
    }

    // 4. Comando
    const body = new URLSearchParams({
      ajax: "1",
      matricola,
      ...ACTIONS[action],
    });
    const r4 = await fetch(DATA_URL, {
      method: "POST",
      headers: {
        ...HEADERS_BASE,
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: cookieHeader(jar),
      },
      body: body.toString(),
    });
    const text = await r4.text();

    return res.status(200).json({
      success: r4.ok,
      action,
      http: r4.status,
      response: text.slice(0, 800),
    });
  } catch (e) {
    return res
      .status(502)
      .json({ success: false, error: `Rete: ${e.message}` });
  }
}

// FreeROB - gestione sequenza "1h profumo - 12 myst"
// action=start | stop | status

import {
  envOk, getState, setState, qstashBatch, qstashCancel, baseUrl, fireMist,
} from "./_lib.js";

export const config = { maxDuration: 30 };

const TOTAL = 12;
const STEP_SECONDS = 300; // 5 minuti

export default async function handler(req, res) {
  const action = (req.query.action || "").toLowerCase();

  if (!envOk()) {
    return res.status(500).json({
      success: false,
      error: "Variabili Upstash mancanti (QSTASH_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)",
    });
  }

  try {
    const state = await getState();

    if (action === "status") {
      return res.status(200).json({ success: true, ...pub(state) });
    }

    if (action === "start") {
      if (state.active) {
        return res.status(200).json({ success: true, already: true, ...pub(state) });
      }
      // 1° myst subito
      const ok = await fireMist(req);
      if (!ok) {
        return res.status(502).json({ success: false, error: "Primo myst rifiutato da FreZanz" });
      }
      // Stato attivo salvato SUBITO (robustezza in caso di errori successivi)
      const newState = {
        active: true,
        sent: 1,
        total: TOTAL,
        startedAt: new Date().toISOString(),
        messageIds: [],
      };
      await setState(newState);
      // Programmo i myst 2..12 in un'unica chiamata batch (delay 5,10,...,55 min)
      const dest = `${baseUrl(req)}/api/step`;
      const entries = [];
      for (let n = 2; n <= TOTAL; n++) {
        entries.push({ destUrl: `${dest}?n=${n}`, delaySeconds: (n - 1) * STEP_SECONDS });
      }
      try {
        newState.messageIds = await qstashBatch(entries);
        await setState(newState);
      } catch (e) {
        // Programmazione fallita: annullo la sequenza per non lasciare stati zombie
        await setState({ active: false, sent: 1, total: TOTAL, messageIds: [] });
        return res.status(502).json({ success: false, error: `Programmazione fallita: ${e.message}` });
      }
      return res.status(200).json({ success: true, ...pub(newState) });
    }

    if (action === "stop") {
      for (const id of state.messageIds || []) await qstashCancel(id);
      const newState = { active: false, sent: state.sent || 0, total: TOTAL, messageIds: [] };
      await setState(newState);
      return res.status(200).json({ success: true, ...pub(newState) });
    }

    return res.status(400).json({ success: false, error: "Azione non valida" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

function pub(s) {
  return { active: !!s.active, sent: s.sent || 0, total: s.total || TOTAL, startedAt: s.startedAt || null };
}

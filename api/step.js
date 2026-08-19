// FreeROB - esecutore del singolo myst programmato (chiamato da QStash)

import { envOk, getState, setState, fireMist } from "./_lib.js";

export default async function handler(req, res) {
  if (!envOk()) return res.status(500).json({ ok: false, error: "env" });

  try {
    const state = await getState();
    // Sequenza interrotta o già conclusa: non fare nulla
    if (!state.active) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const ok = await fireMist(req);
    const n = parseInt(req.query.n || "0", 10);

    state.sent = Math.max(state.sent || 0, isNaN(n) ? 0 : n);
    if (state.sent >= (state.total || 12)) {
      state.active = false;
      state.messageIds = [];
    }
    await setState(state);

    return res.status(200).json({ ok, n, sent: state.sent, active: state.active });
  } catch (e) {
    // 200 comunque: evita retry a raffica di QStash su errori non recuperabili
    return res.status(200).json({ ok: false, error: e.message });
  }
}

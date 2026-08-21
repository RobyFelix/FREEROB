import { useState, useEffect, useCallback } from "react";

const VERSION = "2.1";

// Preset sequenze: etichetta, sottotitolo, numero myst, intervallo (s)
const PRESETS = [
  { id: "p1", title: "60 MIN FAST", sub: "Myst ogni 5 min", total: 12, step: 300 },
  { id: "p2", title: "60 MIN SLOW", sub: "Myst ogni 10 min", total: 6, step: 600 },
  { id: "p3", title: "30 MIN FAST", sub: "Myst ogni 5 min", total: 6, step: 300 },
  { id: "p4", title: "30 MIN SLOW", sub: "Myst ogni 10 min", total: 3, step: 600 },
];

export default function App() {
  const [busy, setBusy] = useState(false); // myst singolo
  const [esito, setEsito] = useState(null);
  const [seq, setSeq] = useState({ active: false, sent: 0, total: 12 });
  const [seqBusy, setSeqBusy] = useState(null); // id preset in invio, o "stop"
  const [seqEsito, setSeqEsito] = useState(null); // { id, ok } per anello sul tasto giusto

  const refreshSeq = useCallback(async () => {
    try {
      const r = await fetch("/api/sequence?action=status");
      const data = await r.json();
      if (data.success) setSeq({ active: data.active, sent: data.sent, total: data.total });
    } catch {
      /* offline: mantengo lo stato attuale */
    }
  }, []);

  useEffect(() => {
    refreshSeq();
    const int = setInterval(refreshSeq, 30000);
    const onVis = () => document.visibilityState === "visible" && refreshSeq();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(int); document.removeEventListener("visibilitychange", onVis); };
  }, [refreshSeq]);

  const sendSingle = async () => {
    if (busy) return;
    setBusy(true);
    setEsito(null);
    try {
      const r = await fetch("/api/freezanz?action=mist");
      const data = await r.json();
      setEsito(data.success && String(data.response).trim() === "1" ? "ok" : "ko");
    } catch {
      setEsito("ko");
    } finally {
      setBusy(false);
      setTimeout(() => setEsito(null), 6000);
    }
  };

  const startSeq = async (p) => {
    if (seqBusy || seq.active) return;
    setSeqBusy(p.id);
    setSeqEsito(null);
    try {
      const r = await fetch(`/api/sequence?action=start&total=${p.total}&step=${p.step}`);
      const data = await r.json();
      if (data.success) {
        setSeq({ active: data.active, sent: data.sent, total: data.total });
        setSeqEsito({ id: p.id, ok: true });
      } else {
        setSeqEsito({ id: p.id, ok: false });
      }
    } catch {
      setSeqEsito({ id: p.id, ok: false });
    } finally {
      setSeqBusy(null);
      setTimeout(() => setSeqEsito(null), 6000);
    }
  };

  const stopSeq = async () => {
    if (seqBusy) return;
    setSeqBusy("stop");
    setSeqEsito(null);
    try {
      const r = await fetch("/api/sequence?action=stop");
      const data = await r.json();
      if (data.success) {
        setSeq({ active: data.active, sent: data.sent, total: data.total });
        setSeqEsito({ id: "stop", ok: true });
      } else {
        setSeqEsito({ id: "stop", ok: false });
      }
    } catch {
      setSeqEsito({ id: "stop", ok: false });
    } finally {
      setSeqBusy(null);
      setTimeout(() => setSeqEsito(null), 6000);
    }
  };

  const ring = (id, base) =>
    seqEsito && seqEsito.id === id
      ? `0 0 0 8px ${seqEsito.ok ? "#2E7D32" : "#C62828"}, ${base}`
      : base;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Profumatore FreeZanz</h1>
        <div style={styles.version}>v{VERSION}</div>
      </header>

      <main style={styles.main}>
        {!seq.active ? (
          <div style={styles.grid}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => startSeq(p)}
                disabled={seqBusy !== null}
                style={{
                  ...styles.rect,
                  opacity: seqBusy && seqBusy !== p.id ? 0.5 : 1,
                  boxShadow: ring(p.id, "0 4px 18px rgba(2,119,189,0.4)"),
                  transition: "box-shadow 0.3s, opacity 0.2s",
                }}
              >
                <span style={styles.rectTitle}>
                  {seqBusy === p.id ? "Invio..." : p.title}
                </span>
                <span style={styles.rectSub}>{p.sub}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={stopSeq}
            disabled={seqBusy !== null}
            style={{
              ...styles.stopBtn,
              opacity: seqBusy ? 0.6 : 1,
              boxShadow: ring("stop", "0 4px 18px rgba(179,38,30,0.45)"),
              transition: "box-shadow 0.3s, opacity 0.2s",
            }}
          >
            <span style={styles.rectTitle}>
              {seqBusy === "stop" ? "Invio..." : "Ferma myst multipli"}
            </span>
            <span style={styles.rectSub}>
              inviati {seq.sent}/{seq.total} — restano {Math.max(seq.total - seq.sent, 0)} myst
            </span>
          </button>
        )}

        <button
          onClick={sendSingle}
          disabled={busy}
          style={{
            ...styles.round,
            opacity: busy ? 0.6 : 1,
            boxShadow:
              esito === "ok"
                ? "0 0 0 8px #2E7D32, 0 5px 20px rgba(2,119,189,0.4)"
                : esito === "ko"
                ? "0 0 0 8px #C62828, 0 5px 20px rgba(2,119,189,0.4)"
                : "0 5px 20px rgba(2,119,189,0.4)",
            transition: "box-shadow 0.3s, opacity 0.2s",
          }}
        >
          {busy ? (
            "Invio..."
          ) : (
            <>
              <span>MYST</span>
              <span style={styles.roundSub}>singolo</span>
            </>
          )}
        </button>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#0B0F14",
    color: "#EDEFF2",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "26px 16px 6px",
  },
  title: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: 0.5, textAlign: "center" },
  version: { fontSize: 12, opacity: 0.55, marginTop: 4 },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 34,
    padding: "26px 22px 50px",
    maxWidth: 460,
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    width: "100%",
  },
  rect: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    border: "none",
    borderRadius: 18,
    padding: "18px 20px",
    width: "100%",
    background: "#0277BD",
    color: "white",
    cursor: "pointer",
  },
  stopBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    border: "none",
    borderRadius: 18,
    padding: "24px 20px",
    width: "100%",
    background: "#B3261E",
    color: "white",
    cursor: "pointer",
  },
  rectTitle: { fontSize: 20, fontWeight: 700, letterSpacing: 1.5 },
  rectSub: { fontSize: 13, fontWeight: 500, opacity: 0.9 },
  round: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    border: "none",
    borderRadius: "50%",
    width: 130,
    height: 130,
    background: "#0277BD",
    color: "white",
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: "pointer",
  },
  roundSub: { fontSize: 12, fontWeight: 500, letterSpacing: 1, opacity: 0.85, textTransform: "none" },
};

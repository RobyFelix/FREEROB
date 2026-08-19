import { useState, useEffect, useCallback } from "react";

const VERSION = "0.6";

// Icona nebulizzazione line-art (tasto singolo)
const IconMist = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="64" height="64">
    <line x1="24" y1="40" x2="24" y2="30" />
    <line x1="16" y1="40" x2="32" y2="40" />
    <line x1="24" y1="26" x2="24" y2="14" />
    <line x1="17" y1="27" x2="11" y2="17" />
    <line x1="31" y1="27" x2="37" y2="17" />
    <circle cx="24" cy="9" r="1.6" fill="currentColor" />
    <circle cx="8.5" cy="13" r="1.6" fill="currentColor" />
    <circle cx="39.5" cy="13" r="1.6" fill="currentColor" />
    <circle cx="15" cy="8" r="1.6" fill="currentColor" />
    <circle cx="33" cy="8" r="1.6" fill="currentColor" />
  </svg>
);

// Icona sequenza: ugello centrale + 12 punti a quadrante (uno per myst)
const IconSeq = () => {
  const dots = [];
  for (let k = 0; k < 12; k++) {
    const a = (k * 30 * Math.PI) / 180;
    dots.push(
      <circle key={k} cx={24 + 17 * Math.sin(a)} cy={24 - 17 * Math.cos(a)} r="1.7" fill="currentColor" stroke="none" />
    );
  }
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="46" height="46">
      {dots}
      <line x1="24" y1="31" x2="24" y2="24" />
      <line x1="21" y1="30" x2="27" y2="30" />
      <line x1="24" y1="21" x2="24" y2="17" />
      <line x1="20" y1="22" x2="18" y2="18.5" />
      <line x1="28" y1="22" x2="30" y2="18.5" />
    </svg>
  );
};

// Icona stop sequenza: quadrato di stop nel quadrante
const IconSeqStop = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="46" height="46">
    <circle cx="24" cy="24" r="17" />
    <rect x="17.5" y="17.5" width="13" height="13" rx="2" fill="currentColor" stroke="none" />
  </svg>
);

export default function App() {
  const [busy, setBusy] = useState(false);
  const [esito, setEsito] = useState(null); // anello tasto singolo
  const [seq, setSeq] = useState({ active: false, sent: 0, total: 12 });
  const [seqBusy, setSeqBusy] = useState(false);
  const [seqEsito, setSeqEsito] = useState(null); // anello tasto sequenza

  const refreshSeq = useCallback(async () => {
    try {
      const r = await fetch("/api/sequence?action=status");
      const data = await r.json();
      if (data.success) setSeq({ active: data.active, sent: data.sent, total: data.total });
    } catch {
      /* offline: lascio lo stato attuale */
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
      const acc = data.success && String(data.response).trim() === "1";
      setEsito(acc ? "ok" : "ko");
    } catch {
      setEsito("ko");
    } finally {
      setBusy(false);
      setTimeout(() => setEsito(null), 6000);
    }
  };

  const toggleSeq = async () => {
    if (seqBusy) return;
    setSeqBusy(true);
    setSeqEsito(null);
    const action = seq.active ? "stop" : "start";
    try {
      const r = await fetch(`/api/sequence?action=${action}`);
      const data = await r.json();
      if (data.success) {
        setSeq({ active: data.active, sent: data.sent, total: data.total });
        setSeqEsito("ok");
      } else {
        setSeqEsito("ko");
      }
    } catch {
      setSeqEsito("ko");
    } finally {
      setSeqBusy(false);
      setTimeout(() => setSeqEsito(null), 6000);
    }
  };

  const ring = (state, base) =>
    state === "ok"
      ? `0 0 0 10px #2E7D32, ${base}`
      : state === "ko"
      ? `0 0 0 10px #C62828, ${base}`
      : base;

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <button
          onClick={sendSingle}
          disabled={busy}
          style={{
            ...styles.btn,
            opacity: busy ? 0.6 : 1,
            boxShadow: ring(esito, "0 6px 24px rgba(2,119,189,0.45)"),
            transition: "box-shadow 0.3s, opacity 0.2s",
          }}
        >
          <IconMist />
          <span style={styles.btnLabel}>{busy ? "Invio..." : "FREEZANZ"}</span>
          <span style={styles.btnSub}>PROFUMO</span>
          <span style={styles.btnVer}>v{VERSION}</span>
        </button>

        <button
          onClick={toggleSeq}
          disabled={seqBusy}
          style={{
            ...styles.rect,
            background: seq.active ? "#B3261E" : "#0277BD",
            opacity: seqBusy ? 0.6 : 1,
            boxShadow: ring(
              seqEsito,
              seq.active
                ? "0 4px 18px rgba(179,38,30,0.45)"
                : "0 4px 18px rgba(2,119,189,0.45)"
            ),
            transition: "box-shadow 0.3s, background 0.3s, opacity 0.2s",
          }}
        >
          {seq.active ? <IconSeqStop /> : <IconSeq />}
          <span style={styles.rectText}>
            <span style={styles.rectTitle}>FREEZANZ</span>
            <span style={styles.rectSub}>
              {seqBusy
                ? "Invio..."
                : seq.active
                ? "Ferma myst multipli"
                : "1 h profumo - 12 myst"}
            </span>
            {seq.active && (
              <span style={styles.rectProg}>myst {seq.sent}/{seq.total}</span>
            )}
          </span>
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
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 44,
    padding: "40px 22px 60px",
  },
  btn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    border: "none",
    borderRadius: "50%",
    width: 240,
    height: 240,
    justifyContent: "center",
    background: "#0277BD",
    color: "white",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: "pointer",
  },
  btnLabel: {},
  btnSub: { fontSize: 17, fontWeight: 600, letterSpacing: 3, opacity: 0.9 },
  btnVer: { fontSize: 11, fontWeight: 400, letterSpacing: 1, opacity: 0.6 },
  rect: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    border: "none",
    borderRadius: 22,
    padding: "20px 26px",
    minWidth: 260,
    color: "white",
    cursor: "pointer",
  },
  rectText: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 },
  rectTitle: { fontSize: 19, fontWeight: 700, letterSpacing: 2 },
  rectSub: { fontSize: 14, fontWeight: 500, opacity: 0.92 },
  rectProg: { fontSize: 12, fontWeight: 400, opacity: 0.75 },
};

import { useState } from "react";

const VERSION = "0.2b";

// Icona nebulizzazione line-art
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

export default function App() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { ok, msg }

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setToast(null);
    try {
      const r = await fetch("/api/freezanz?action=mist");
      const data = await r.json();
      if (data.success) {
        setToast({ ok: true, msg: `Comando inviato — risposta server: ${String(data.response).slice(0, 60)}` });
      } else {
        setToast({ ok: false, msg: data.error || `Errore (HTTP ${data.http || r.status})` });
      }
    } catch {
      setToast({ ok: false, msg: "Errore di rete" });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>FreeROB</h1>
        <div style={styles.version}>v{VERSION}</div>
      </header>

      <main style={styles.main}>
        <button
          onClick={send}
          disabled={busy}
          style={{ ...styles.btn, opacity: busy ? 0.6 : 1 }}
        >
          <IconMist />
          <span style={styles.btnLabel}>{busy ? "Invio..." : "FREEZANZ"}</span>
        </button>
      </main>

      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.ok ? "#1B5E20" : "#7B1F1F",
          }}
        >
          {toast.msg}
        </div>
      )}
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
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "28px 16px 8px",
  },
  title: { margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: 1 },
  version: { fontSize: 13, opacity: 0.55, marginTop: 4 },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px 22px 60px",
  },
  btn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
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
    boxShadow: "0 6px 24px rgba(2,119,189,0.45)",
    transition: "opacity 0.2s",
  },
  btnLabel: {},
  toast: {
    position: "fixed",
    left: "50%",
    bottom: 28,
    transform: "translateX(-50%)",
    padding: "13px 22px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 500,
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    maxWidth: "88vw",
    textAlign: "center",
  },
};

import { useState } from "react";

const VERSION = "0.1";

// Icone SVG line-art minimali (tratti bianchi semplici)
const IconZanzara = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="42" height="42">
    <ellipse cx="24" cy="27" rx="5" ry="10" />
    <circle cx="24" cy="13" r="3.5" />
    <line x1="24" y1="16.5" x2="24" y2="17.5" />
    <line x1="19" y1="22" x2="8" y2="14" />
    <line x1="29" y1="22" x2="40" y2="14" />
    <line x1="19.5" y1="28" x2="7" y2="28" />
    <line x1="28.5" y1="28" x2="41" y2="28" />
    <line x1="20" y1="33" x2="10" y2="41" />
    <line x1="28" y1="33" x2="38" y2="41" />
  </svg>
);

const IconMosca = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="42" height="42">
    <ellipse cx="24" cy="30" rx="7" ry="9" />
    <circle cx="24" cy="15" r="4.5" />
    <ellipse cx="13" cy="24" rx="7" ry="4" transform="rotate(-30 13 24)" />
    <ellipse cx="35" cy="24" rx="7" ry="4" transform="rotate(30 35 24)" />
  </svg>
);

const IconProfumo = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="42" height="42">
    <path d="M24 40c-6 0-9-4-9-8 0-5 5-8 9-14 4 6 9 9 9 14 0 4-3 8-9 8z" />
    <line x1="24" y1="6" x2="24" y2="12" />
    <line x1="17" y1="9" x2="19.5" y2="13.5" />
    <line x1="31" y1="9" x2="28.5" y2="13.5" />
  </svg>
);

const BUTTONS = [
  { id: "zanzare", label: "Repellente Zanzare", color: "#2E7D5B", Icon: IconZanzara },
  { id: "mosche", label: "Repellente Mosche", color: "#0277BD", Icon: IconMosca },
  { id: "profumo", label: "Profumo Menta", color: "#6A4FA3", Icon: IconProfumo },
];

export default function App() {
  const [busy, setBusy] = useState(null); // id azione in corso
  const [toast, setToast] = useState(null); // { ok, msg }

  const send = async (id, label) => {
    if (busy) return;
    setBusy(id);
    setToast(null);
    try {
      const r = await fetch(`/api/freezanz?action=${id}`);
      const data = await r.json();
      if (data.success) {
        setToast({ ok: true, msg: `${label}: ciclo avviato` });
      } else {
        setToast({ ok: false, msg: data.error || `Errore (HTTP ${data.http || r.status})` });
      }
    } catch {
      setToast({ ok: false, msg: "Errore di rete" });
    } finally {
      setBusy(null);
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
        {BUTTONS.map(({ id, label, color, Icon }) => (
          <button
            key={id}
            onClick={() => send(id, label)}
            disabled={busy !== null}
            style={{
              ...styles.btn,
              background: color,
              opacity: busy && busy !== id ? 0.45 : 1,
            }}
          >
            <Icon />
            <span style={styles.btnLabel}>
              {busy === id ? "Invio..." : label}
            </span>
          </button>
        ))}
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
  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: 1,
  },
  version: {
    fontSize: 13,
    opacity: 0.55,
    marginTop: 4,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 22,
    padding: "16px 22px 40px",
    maxWidth: 460,
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    border: "none",
    borderRadius: 20,
    padding: "26px 24px",
    color: "white",
    fontSize: 20,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
    transition: "opacity 0.2s",
  },
  btnLabel: {
    textAlign: "left",
  },
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

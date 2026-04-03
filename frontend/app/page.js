'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input,
        }),
      });

      const data = await res.json();
      console.log('Response:', data);
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.gridOverlay}></div>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logoBox}>
            <span style={styles.logoSymbol}>⚛</span>
          </div>
          <div>
            <h1 style={styles.title}>COGNIS PROTON</h1>
            <p style={styles.subtitle}>Quantum Financial Enforcement</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>TRADE EXECUTION</span>
            <span style={styles.cardBadge}>LIVE</span>
          </div>
          
          <div style={styles.inputWrapper}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter command: Buy 100 AAPL"
              style={styles.input}
              disabled={loading}
            />
            <button 
              onClick={handleSubmit} 
              style={{
                ...styles.button,
                ...(loading && styles.buttonLoading),
              }}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  PROCESSING
                </>
              ) : (
                <>EXECUTE →</>
              )}
            </button>
          </div>
          <div style={styles.hint}>⌘ + Enter to execute</div>
        </div>

        {/* Response Display */}
        {response && (
          <div style={styles.responseCard}>
            <div style={styles.responseHeader}>
              <div style={styles.responseHeaderLeft}>
                <span style={styles.responseLabel}>SYSTEM RESPONSE</span>
                <span style={styles.responseId}>
                  ID: {response.request_id?.slice(0, 8) || 'N/A'}
                </span>
              </div>
              <div style={{
                ...styles.statusPill,
                ...(response.decision === 'ALLOW' ? styles.statusAllow : 
                    response.decision === 'BLOCK' ? styles.statusBlock : 
                    styles.statusNeutral)
              }}>
                <span style={styles.statusDot}></span>
                {response.decision || 'PROCESSED'}
              </div>
            </div>
            <pre style={styles.jsonDisplay}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {!response && !loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⟁</div>
            <p style={styles.emptyTitle}>AWAITING INPUT</p>
            <p style={styles.emptyText}>System ready for trade execution</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <span>COGNIS PROTON v2.0</span>
          <span style={styles.footerDivider}>|</span>
          <span>SECURE</span>
          <span style={styles.footerDivider}>|</span>
          <span>COMPLIANT</span>
          <span style={styles.footerDivider}>|</span>
          <span>REAL-TIME</span>
        </div>
      </footer>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: '#0a0e14',
    color: '#e6e8eb',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(255, 107, 0, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 107, 0, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    position: 'relative',
    zIndex: 1,
    padding: '40px 20px',
    borderBottom: '1px solid rgba(255, 107, 0, 0.15)',
    background: 'linear-gradient(180deg, rgba(10, 14, 20, 0.95) 0%, rgba(10, 14, 20, 0.7) 100%)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  logoBox: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    boxShadow: '0 0 30px rgba(255, 107, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 140, 0, 0.3)',
  },
  logoSymbol: {
    fontSize: '32px',
    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))',
  },
  title: {
    fontSize: '36px',
    fontWeight: '900',
    margin: '0',
    color: '#ffffff',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textShadow: '0 0 20px rgba(255, 107, 0, 0.5)',
  },
  subtitle: {
    fontSize: '13px',
    color: '#ff6b00',
    margin: '4px 0 0 0',
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  container: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '60px 20px',
  },
  card: {
    background: 'linear-gradient(135deg, rgba(20, 25, 32, 0.95) 0%, rgba(15, 19, 25, 0.95) 100%)',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    borderRadius: '2px',
    padding: '32px',
    marginBottom: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 107, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 107, 0, 0.15)',
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ff6b00',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  cardBadge: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#00ff88',
    letterSpacing: '0.15em',
    padding: '4px 10px',
    background: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '2px',
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  input: {
    flex: '1',
    padding: '18px 20px',
    fontSize: '15px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 107, 0, 0.25)',
    borderRadius: '2px',
    color: '#ffffff',
    outline: 'none',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    transition: 'all 0.2s ease',
    letterSpacing: '0.02em',
  },
  button: {
    padding: '18px 40px',
    fontSize: '13px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%)',
    color: '#ffffff',
    border: '1px solid rgba(255, 140, 0, 0.5)',
    borderRadius: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 16px rgba(255, 107, 0, 0.3)',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  buttonLoading: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },
  hint: {
    fontSize: '11px',
    color: '#6b7280',
    fontFamily: '"JetBrains Mono", monospace',
    letterSpacing: '0.05em',
  },
  responseCard: {
    background: 'linear-gradient(135deg, rgba(20, 25, 32, 0.95) 0%, rgba(15, 19, 25, 0.95) 100%)',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    borderRadius: '2px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    animation: 'slideUp 0.3s ease',
  },
  responseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 107, 0, 0.15)',
  },
  responseHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  responseLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ff6b00',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  responseId: {
    fontSize: '10px',
    color: '#6b7280',
    fontFamily: '"JetBrains Mono", monospace',
    letterSpacing: '0.05em',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '2px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    border: '1px solid',
  },
  statusAllow: {
    background: 'rgba(0, 255, 136, 0.1)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
    color: '#00ff88',
  },
  statusBlock: {
    background: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
    color: '#ff3b30',
  },
  statusNeutral: {
    background: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    color: '#9ca3af',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'currentColor',
    animation: 'pulse 2s ease-in-out infinite',
  },
  jsonDisplay: {
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '24px',
    borderRadius: '2px',
    fontSize: '13px',
    lineHeight: '1.7',
    color: '#9ca3af',
    overflow: 'auto',
    maxHeight: '500px',
    margin: '0',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    border: '1px solid rgba(255, 107, 0, 0.1)',
    letterSpacing: '0.02em',
  },
  emptyState: {
    textAlign: 'center',
    padding: '100px 20px',
    background: 'linear-gradient(135deg, rgba(20, 25, 32, 0.5) 0%, rgba(15, 19, 25, 0.5) 100%)',
    border: '1px dashed rgba(255, 107, 0, 0.2)',
    borderRadius: '2px',
  },
  emptyIcon: {
    fontSize: '72px',
    color: '#ff6b00',
    marginBottom: '20px',
    opacity: '0.3',
    fontWeight: '100',
  },
  emptyTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ff6b00',
    margin: '0 0 8px 0',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    letterSpacing: '0.02em',
  },
  footer: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '30px 20px',
    borderTop: '1px solid rgba(255, 107, 0, 0.15)',
    background: 'rgba(10, 14, 20, 0.8)',
  },
  footerContent: {
    fontSize: '10px',
    color: '#6b7280',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  footerDivider: {
    margin: '0 12px',
    color: '#ff6b00',
    opacity: '0.3',
  },
};

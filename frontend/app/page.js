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
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚡</div>
          <h1 style={styles.title}>COGNIS PROTON</h1>
        </div>
        <p style={styles.subtitle}>AI-Powered Financial Enforcement System</p>
      </div>

      {/* Input Section */}
      <div style={styles.container}>
        <div style={styles.card}>
          <label style={styles.label}>Enter Trading Command</label>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Buy 100 shares of AAPL"
              style={styles.input}
              disabled={loading}
            />
            <button 
              onClick={handleSubmit} 
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
                ...(input.trim() ? styles.buttonActive : {})
              }}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <span style={styles.buttonContent}>
                  <span style={styles.spinner}></span>
                  Processing...
                </span>
              ) : (
                <span style={styles.buttonContent}>
                  <span style={styles.buttonIcon}>→</span>
                  Execute
                </span>
              )}
            </button>
          </div>
          <p style={styles.hint}>Press Enter to submit</p>
        </div>

        {/* Response Section */}
        {response && (
          <div style={styles.responseCard}>
            <div style={styles.responseHeader}>
              <h3 style={styles.responseTitle}>
                <span style={styles.responseIcon}>📊</span>
                API Response
              </h3>
              <div style={styles.statusBadge}>
                <span style={{
                  ...styles.statusDot,
                  backgroundColor: response.decision === 'ALLOW' ? '#10b981' : 
                                   response.decision === 'BLOCK' ? '#ef4444' : '#6b7280'
                }}></span>
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
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyText}>No response yet</p>
            <p style={styles.emptySubtext}>Enter a command above to get started</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Powered by COGNIS • Secure • Compliant • Real-time
        </p>
      </footer>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '0',
    margin: '0',
  },
  header: {
    textAlign: 'center',
    padding: '60px 20px 40px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.4) 100%)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '12px',
  },
  logoIcon: {
    fontSize: '48px',
    filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
  },
  title: {
    fontSize: '48px',
    fontWeight: '800',
    margin: '0',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '18px',
    color: '#94a3b8',
    margin: '0',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '12px',
    letterSpacing: '0.025em',
    textTransform: 'uppercase',
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
  },
  input: {
    flex: '1',
    padding: '16px 20px',
    fontSize: '16px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '12px',
    color: '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  button: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
    whiteSpace: 'nowrap',
  },
  buttonActive: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    boxShadow: '0 6px 8px -1px rgba(59, 130, 246, 0.4)',
  },
  buttonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  buttonIcon: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },
  hint: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0',
    fontStyle: 'italic',
  },
  responseCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    animation: 'fadeIn 0.3s ease',
  },
  responseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  responseTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#f8fafc',
  },
  responseIcon: {
    fontSize: '24px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#e2e8f0',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite',
  },
  jsonDisplay: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '24px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#94a3b8',
    overflow: 'auto',
    maxHeight: '500px',
    margin: '0',
    fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'rgba(30, 41, 59, 0.3)',
    borderRadius: '20px',
    border: '2px dashed rgba(148, 163, 184, 0.2)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: '0.5',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#cbd5e1',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0',
  },
  footer: {
    textAlign: 'center',
    padding: '40px 20px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
  },
  footerText: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0',
  },
};

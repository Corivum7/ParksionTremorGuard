import React from 'react';

const App: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>TremorGuard</h1>
        <h2 style={styles.subtitle}>Doctor Dashboard v0.1.0</h2>
        <p style={styles.description}>帕金森病震颤监测智能腕带 - 医生端仪表盘</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0f',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 700,
    margin: 0,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: 500,
    color: '#9ca3af',
    margin: 0,
    marginBottom: '24px',
  },
  description: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
};

export default App;

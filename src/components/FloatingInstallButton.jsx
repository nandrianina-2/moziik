import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

const FloatingInstallButton = () => {
  const [promptInstall, setPromptInstall] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPromptInstall(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!promptInstall) return;
    
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={styles.container} className='z-50'>
      <div style={styles.content}>
        <span style={styles.icon}>
          {<img src={logo} alt="Moziik" style={{ width: '24px', height: '24px' }} /> }
        </span>
        <div style={styles.textContainer}>
          <p style={styles.title}>Installer Moziik</p>
          <p style={styles.subtitle}>Accédez plus vite à vos contenus !</p>
        </div>
        <button onClick={handleInstallClick} style={styles.button}>
          Installer
        </button>
        <button onClick={() => setIsVisible(false)} style={styles.closeBtn}>
          ✕
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    width: '90%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0px 8px 24px rgba(0,0,0,0.15)',
    padding: '12px 16px',
    border: '1px solid #eee',
    animation: 'slideUp 0.4s ease-out',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '24px',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  subtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF', // Bleu style iOS/Vite
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  }
};

export default FloatingInstallButton;
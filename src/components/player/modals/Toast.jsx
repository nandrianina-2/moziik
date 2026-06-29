import { useState, useEffect } from 'react';

/**
 * @param {{ message: string, icon?: string, onDone: () => void }} props
 */
const Toast = ({ message, icon, onDone }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDone, 320);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`fp-toast${leaving ? ' out' : ''}`}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      {message}
    </div>
  );
};

export default Toast;
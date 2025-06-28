import React from 'react';
import '../css/StatusMessages.css';

export default function StatusMessage({ type, children }) {
  // type: 'error', 'success', or 'win'
  let className = 'status-message';
  if (type === 'error') className += ' status-message--error';
  if (type === 'success') className += ' status-message--success';
  if (type === 'win') className = 'win-message';

  return <div className={className}>{children}</div>;
}

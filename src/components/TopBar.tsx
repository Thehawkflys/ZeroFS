import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export function TopBar({ title, back, children }: { title: ReactNode; back?: string; children?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      {back !== undefined ? (
        <button className="icon-btn" aria-label="Back" onClick={() => navigate(back)}>
          ‹
        </button>
      ) : (
        <span className="topbar-spacer" />
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">{children}</div>
    </header>
  );
}

import { useEffect, useRef, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { requestPersistentStorage } from '../db';
import { exportBackup, importBackup, saveBackupFile } from '../lib/backup';

export function Settings() {
  const [status, setStatus] = useState<string>('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
    navigator.storage
      ?.estimate?.()
      .then((e) => e.usage !== undefined && setUsage(`${(e.usage / 1024 / 1024).toFixed(1)} MB used`))
      .catch(() => {});
  }, []);

  const doExport = async () => {
    setStatus('Preparing backup…');
    try {
      const backup = await exportBackup();
      await saveBackupFile(backup);
      setStatus(`Backup ready: ${backup.songs.length} songs.`);
    } catch (e) {
      setStatus(`Backup failed: ${(e as Error).message}`);
    }
  };

  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const r = await importBackup(data);
      setStatus(`Restored: ${r.added} added, ${r.updated} updated, ${r.skipped} unchanged.`);
    } catch (e) {
      setStatus(`Restore failed: ${(e as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;

  return (
    <div className="page">
      <TopBar title="Settings" back="/" />
      <main className="content form">
        <section className="card">
          <h2>Backup</h2>
          <p className="muted">
            Your songs are stored only on this device. Save a backup now and then (e.g. to iCloud Drive via Files).
          </p>
          <div className="control-row">
            <button className="btn-primary" onClick={doExport}>
              Save backup
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              Restore from backup
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
          />
          {status && <p className="status">{status}</p>}
        </section>

        <section className="card">
          <h2>Storage</h2>
          <p className="muted">
            {persisted ? 'Storage is protected from automatic clean-up.' : 'Storage may be cleared by the browser if unused.'}{' '}
            {usage}
          </p>
          {!persisted && (
            <button className="btn" onClick={async () => setPersisted(await requestPersistentStorage())}>
              Protect storage
            </button>
          )}
          {!isStandalone && (
            <p className="muted">
              Tip: on iPhone, tap Share → <strong>Add to Home Screen</strong> in Safari. The app then works offline and
              iOS keeps your songs safe.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

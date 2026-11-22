import { HashRouter, Route, Routes } from 'react-router-dom';
import { Library } from './pages/Library';
import { SongView } from './pages/SongView';
import { SongEditor } from './pages/SongEditor';
import { Settings } from './pages/Settings';

// HashRouter keeps deep links working on static hosting (GitHub Pages) and offline.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/new" element={<SongEditor />} />
        <Route path="/song/:id" element={<SongView />} />
        <Route path="/song/:id/edit" element={<SongEditor />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Library />} />
      </Routes>
    </HashRouter>
  );
}

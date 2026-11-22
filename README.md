# ZeroFS
Music app without the hassle: a personal song book for practising guitar. It's an
installable web app (PWA) that works offline on an iPhone on a music stand.

## Features so far (stage 1)
- Library of songs stored on the device (IndexedDB), with simple search and "Recently played"
- Songs stored as [ChordPro](https://www.chordpro.org/), e.g. `[G]Here comes the [C]sun`
- Chords rendered over the right syllable and kept aligned when lines wrap
- Transpose, capo (changes the shapes shown, keeps the sounding key), sharps/flats, text size
- Song fields: title, artist, key, capo, tempo, length, tuning, tags, notes; favourites
- Backup to a file (iOS share sheet → Save to Files) and restore
- Works fully offline after the first load

## Develop
```bash
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # production build in dist/
```

## Install on iPhone
1. Open the deployed site in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch it from the home screen. It now works offline and iOS keeps its storage.

## Deploy (GitHub Pages)
`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.
The site is served at `https://<user>.github.io/ZeroFS/`.

## Roadmap
1. ✅ Foundation: storage, editor, ChordPro, transpose/capo, backup
2. Import: paste/files (.txt, .cho), chords-over-lyrics → ChordPro
3. Chord diagrams (chords-db + svguitar), alternate tunings, tuning guide
4. Auto-scroll, wake lock, performance mode, Bluetooth pedal
5. Fuzzy search, filters, favourites, play count
6. Attachments: Guitar Pro / MusicXML (alphaTab), PDF, images, audio
7. Claude-powered import of PDFs, photos and web pages

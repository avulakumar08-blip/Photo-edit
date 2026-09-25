import React, { useState } from 'react';
import { PuzzleStudio } from './components/puzzle/PuzzleStudio';
import { PhotoEditorApp } from './components/photoEditor/PhotoEditorApp';

export default function App() {
  const [activeApp, setActiveApp] = useState<'puzzle' | 'photo-editor'>('puzzle');

  if (activeApp === 'photo-editor') {
    return (
      <PhotoEditorApp onSwitchToPuzzle={() => setActiveApp('puzzle')} />
    );
  }

  return (
    <PuzzleStudio onSwitchToPhotoEditor={() => setActiveApp('photo-editor')} />
  );
}

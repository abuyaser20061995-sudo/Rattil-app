import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import Mushaf from './pages/Mushaf.jsx';
import Memorization from './pages/Memorization.jsx';
import Review from './pages/Review.jsx';
import More from './pages/More.jsx';
import Ayati from './pages/Ayati.jsx';
import WhatToRead from './pages/WhatToRead.jsx';
import ManageSuggestions from './pages/ManageSuggestions.jsx';
import DataBackup from './pages/DataBackup.jsx';
import Settings from './pages/Settings.jsx';
import Notes from './pages/Notes.jsx';

export default function App() {
  return (
    <>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mushaf" element={<Mushaf />} />
          <Route path="/memorization" element={<Memorization />} />
          <Route path="/review" element={<Review />} />
          <Route path="/more" element={<More />} />
          <Route path="/ayati" element={<Ayati />} />
          <Route path="/what-to-read" element={<WhatToRead />} />
          <Route path="/manage-suggestions" element={<ManageSuggestions />} />
          <Route path="/backup" element={<DataBackup />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notes" element={<Notes />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}

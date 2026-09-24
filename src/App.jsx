import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import Mushaf from './pages/Mushaf.jsx';
import Memorization from './pages/Memorization.jsx';
import Review from './pages/Review.jsx';
import More from './pages/More.jsx';

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
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}

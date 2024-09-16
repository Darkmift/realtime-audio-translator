import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Broadcast from './pages/Broadcast';
import Watch from './pages/Watch';
import Navbar from './components/Navbar';
import './App.css'; // Import the CSS for the layout

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/broadcast" element={<Broadcast />} />
            <Route path="/watch" element={<Watch />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

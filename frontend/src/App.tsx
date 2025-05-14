import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/chats" className="logo">
            <img src="/assets/chatbot.jpg" alt="Logo" className="logo-img" />
            <span>Нейросеть технопарка ЦО Восход</span>
          </Link>
          <div className="nav-links">
            <Link to="/chats" className="button-primary">
              Нейро-чат
            </Link>
          </div>
        </nav>

        <div className="main-content">
          <Routes>
            <Route path="/chats" element={<ChatPage />} />
            <Route path="/" element={<Navigate to="/chats" replace />} />
          </Routes>
        </div>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="/assets/chatbot.jpg" alt="Logo" className="logo-img" />
              <span>Нейросеть технопарка ЦО Восход</span>
            </div>
            <div className="social-links">
              <a href="https://t.me/your-channel" className="social-link" aria-label="Telegram">
                <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M363.226 140.023C363.761 137.26 360.98 135.027 358.398 136.147L146.324 228.059C133.479 233.626 131.233 250.891 142.225 259.56L163.497 276.335C171.34 282.52 182.237 283.071 190.665 277.708L281.676 219.792C287.637 215.999 294.517 223.101 290.535 228.939L243.879 297.347C236.732 307.826 239.191 322.085 249.433 329.566L293.443 361.707C304.392 369.704 319.939 363.595 322.516 350.284L363.226 140.023ZM357.205 133.394C362.001 131.315 367.165 135.461 366.171 140.594L325.462 350.854C322.467 366.324 304.398 373.423 291.673 364.13L247.664 331.988C236.114 323.552 233.342 307.473 241.401 295.656L288.057 227.248C290.201 224.105 286.496 220.28 283.286 222.323L192.276 280.239C182.772 286.287 170.484 285.666 161.639 278.69L140.368 261.915C127.593 251.841 130.203 231.776 145.131 225.306L357.205 133.394Z" fill="white"/>
                  <path d="M358.398 136.147C360.98 135.027 363.761 137.26 363.226 140.023L322.516 350.284C319.939 363.595 304.392 369.704 293.443 361.707L249.433 329.566C239.191 322.085 236.732 307.826 243.879 297.347L290.535 228.939C294.517 223.101 287.637 215.999 281.676 219.792L190.665 277.708C182.237 283.071 171.34 282.52 163.497 276.335L142.225 259.56C131.233 250.891 133.479 233.626 146.324 228.059L358.398 136.147Z" fill="white"/>
                </svg>
              </a>
              
              <a href="https://github.com/AlexKpac/co-voshod.tech" className="social-link" aria-label="GitHub">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.477 2 12C2 16.418 4.865 20.166 8.839 21.489C9.339 21.57 9.5 21.26 9.5 20.988C9.5 20.749 9.5 20.009 9.5 19C6.5 19.5 6 17.5 6 17.5C5.5 16 4.5 15.5 4.5 15.5C3.5 14.5 4.5 14.5 4.5 14.5C5.5 14.5 6 15.5 6 15.5C7 17 8 17.5 9 17C9 16 9.25 15.5 9.5 15.25C6.5 15 4 13.5 4 9.5C4 8.25 4.5 7.25 5.5 6.5C5.3 6 5 5 5.5 3.5C5.5 3.5 6.5 3 9 5C10 4.75 11 4.75 12 5C13 4.75 14 4.75 15 5C17.5 3 18.5 3.5 18.5 3.5C19 5 18.75 6 18.5 6.5C19.5 7.25 20 8.25 20 9.5C20 13.5 17.5 15 14.5 15.25C15 15.75 15.5 16.75 15.5 18C15.5 19.5 15.5 20.688 15.5 20.988C15.5 21.26 15.661 21.57 16.161 21.489C20.135 20.166 23 16.418 23 12C23 6.477 18.523 2 12 2Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2025 Нейросеть технопарка ЦО Восход</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

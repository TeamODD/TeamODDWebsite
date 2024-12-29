import "./styles/App.css";
import Header from "./components/Header";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Projects from "./routes/Projects";
import Home from "./routes/Home";
import { useEffect } from "react";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    const queryPath = window.location.search.slice(1);
    if (queryPath) {
      navigate(queryPath);
    }
  }, [navigate]);

  return (
    <div className="App">
      <header>
        <Header />
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </div>
  );
}

export default App;

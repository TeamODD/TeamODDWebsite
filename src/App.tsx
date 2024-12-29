import "./styles/App.css";
import Header from "./components/Header";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

const Home = lazy(() => import("./routes/Home"));
const Projects = lazy(() => import("./routes/Projects"));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<div>Loading...</div>}></Suspense>
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

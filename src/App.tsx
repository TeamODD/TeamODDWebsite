import "./styles/App.css";
import Header from "./components/Header";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { lazy, memo, Suspense, useEffect } from "react";
import Footer from "./components/Footer";
import Loading from "./routes/Loading";

const Home = lazy(() => import("./routes/Home"));
const Projects = lazy(() => import("./routes/Projects"));
const Join = lazy(() => import("./routes/Join"));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<Loading />}>
        <AppContent />
      </Suspense>
    </BrowserRouter>
  );
}

const AppContent = memo(() => {
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
        <Route path="/join" element={<Join />} />
      </Routes>
      <footer>
        <Footer />
      </footer>
    </div>
  );
});

export default App;

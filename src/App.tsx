import "./styles/App.css";
import Header from "./components/Header";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, memo } from "react";
import Footer from "./components/Footer";

const Home = lazy(() => import("./routes/Home"));
const Projects = lazy(() => import("./routes/Projects"));
const Join = lazy(() => import("./routes/Join"));
const Contact = lazy(() => import("./routes/Contact"));

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

const AppContent = memo(() => {
  return (
    <div className="App">
      <header>
        <Header />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/join" element={<Join />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
});

export default App;

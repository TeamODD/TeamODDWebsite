import "./styles/App.css";
import Header from "./components/Header";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, memo, Suspense } from "react";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Loading from "./components/Loading";

const Home = lazy(() => import("./routes/Home"));
const Projects = lazy(() => import("./routes/Projects"));
const Join = lazy(() => import("./routes/Join"));
const Contact = lazy(() => import("./routes/Contact"));
const Admin = lazy(() => import("./routes/Admin"));
const Login = lazy(() => import("./routes/Login"));

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
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/join" element={<Join />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
});

export default App;

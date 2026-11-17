import "./styles/App.css";
import Header from "./components/Header";
import TopBarPreview from "./components/TopBarPreview";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { lazy, memo, Suspense, useEffect, useState } from "react";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Loading from "./components/Loading";
import ScrollToTop from "./components/ScrollToTop";

const HomePreview = lazy(() => import("./routes/HomePreview"));
const Projects = lazy(() => import("./routes/Projects"));
const Join = lazy(() => import("./routes/Join"));
const Contact = lazy(() => import("./routes/Contact"));
const Login = lazy(() => import("./routes/Login"));
const Signup = lazy(() => import("./routes/Signup"));
const VerifyEmail = lazy(() => import("./routes/VerifyEmail"));
const Profile = lazy(() => import("./routes/Profile"));
const GameInfo = lazy(() => import("./routes/GameInfo"));
const Events = lazy(() => import("./routes/Events"));
const Operations = lazy(() => import("./routes/Operations"));
const ClubIntro = lazy(() => import("./routes/ClubIntro"));
const AdminConsole = lazy(() => import("./routes/AdminConsole"));
const AdminPending = lazy(() => import("./routes/AdminPending"));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}

const AppContent = memo(() => {
  const location = useLocation();
  const isPreview = !["/login","/signup","/verify-email"].includes(location.pathname);
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/verify-email";
  const [isNavStuck, setIsNavStuck] = useState(false);

  useEffect(() => {
    if (!isPreview) return;

    const updateNav = () => {
      const topBar = document.querySelector(".odd-top-bar-preview");
      setIsNavStuck(topBar ? topBar.getBoundingClientRect().bottom <= 0 : false);
    };

    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
    return () => window.removeEventListener("scroll", updateNav);
  }, [isPreview]);

  return (
    <div className={isAuthPage ? "login-layout" : isPreview ? `preview-layout${isNavStuck ? " nav-scrolled" : ""}` : undefined}>
      {isPreview && <TopBarPreview />}

      {!isAuthPage && <Header isPreview={isPreview} />}

      <main className={location.pathname.startsWith("/admin") ? "admin-main" : undefined}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePreview />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:id" element={<GameInfo />} />
            <Route path="/join" element={<Join />} />
            <Route path="/events" element={<Events />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/club" element={<ClubIntro />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminConsole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pending"
              element={
                <ProtectedRoute>
                  <AdminPending />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home-preview"
              element={<HomePreview />}
            />
          </Routes>
        </Suspense>
      </main>

      {!isAuthPage && <Footer />}
    </div>
  );
});

export default App;

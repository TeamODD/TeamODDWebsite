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
      <Suspense fallback={<Loading />}>
        <AppContent />
      </Suspense>
    </BrowserRouter>
  );
}

/**
 * `AppContent` 컴포넌트는 애플리케이션의 주요 레이아웃을 구성합니다.
 *
 * 이 컴포넌트는 `memo`를 사용하여 불필요한 리렌더링을 방지합니다.
 *
 * @returns {JSX.Element} 애플리케이션의 주요 레이아웃을 포함하는 JSX 요소를 반환합니다.
 *
 * @component
 * @example
 * ```tsx
 * <AppContent />
 * ```
 *
 * @remarks
 * 이 컴포넌트는 다음과 같은 구조로 이루어져 있습니다:
 * - `Header` 컴포넌트가 포함된 `header` 요소
 * - 여러 `Route` 컴포넌트를 포함한 `main` 요소
 * - `Footer` 컴포넌트가 포함된 `footer` 요소
 *
 * `Route` 컴포넌트는 다음과 같은 경로와 요소를 매핑합니다:
 * - `/` 경로는 `Home` 컴포넌트를 렌더링합니다.
 * - `/projects` 경로는 `Projects` 컴포넌트를 렌더링합니다.
 * - `/join` 경로는 `Join` 컴포넌트를 렌더링합니다.
 * - `/contact` 경로는 `Contact` 컴포넌트를 렌더링합니다.
 * - `/login` 경로는 `Login` 컴포넌트를 렌더링합니다.
 * - `/admin` 경로는 `ProtectedRoute` 컴포넌트를 통해 보호된 `Admin` 컴포넌트를 렌더링합니다.
 */
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
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
});

export default App;

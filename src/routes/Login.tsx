import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { browserLocalPersistence, browserSessionPersistence, setPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { isVerifiedAccount } from "../auth/isVerifiedAccount";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      await setPersistence(auth, autoLogin ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(isVerifiedAccount(credential.user) ? "/home-preview" : "/verify-email", { replace: true });
    } catch (caughtError) {
      if (caughtError instanceof FirebaseError && caughtError.code === "auth/too-many-requests") {
        setError("로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.");
      } else if (caughtError instanceof FirebaseError && caughtError.code === "auth/network-request-failed") {
        setError("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
      } else {
        setError("로그인 실패 · 입력 정보를 확인해 주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__background" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" disablePictureInPicture>
          <source src={`${import.meta.env.BASE_URL}images/home/home.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}images/home/home.mp4`} type="video/mp4" />
        </video>
      </div>
      <div className="login-shell">
        <section className="login-intro" aria-label="Team ODD 소개">
          <div className="login-intro__content">
            <div className="login-intro__brand" aria-label="Team ODD">
              <img
                className="login-intro__logo"
                src={`${import.meta.env.BASE_URL}images/top-bar/top-bar-logo-teamodd-001.webp`}
                alt=""
              />
              <span>TEAM ODD</span>
            </div>
            <div className="login-intro__bottom">
              <span className="login-intro__eyebrow">TEAM ODD</span>
              <h1>열정이 있다면<br />누구나 함께.</h1>
              <p>한성대학교 중앙게임개발동아리 Team ODD</p>
            </div>
          </div>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <Link className="login-panel__back" to="/home-preview">
            <FiArrowLeft aria-hidden="true" /> 홈으로 돌아가기
          </Link>
          <div className="login-panel__content">
            <div className="login-panel__heading">
              <h2 id="login-title">로그인</h2>
              <p>로그인하고 Team ODD의 다양한 활동에 참여해 보세요.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-field__sr-only" htmlFor="login-email">이메일</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setError(""); }}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-field__sr-only" htmlFor="login-password">비밀번호</label>
                <div className="login-field__password">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError(""); }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <label className="login-form__auto-login">
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(event) => setAutoLogin(event.target.checked)}
                />
                <span>자동 로그인</span>
              </label>

              {error && <p className="login-form__error" role="alert">{error}</p>}

              <div className="login-form__divider" aria-hidden="true" />
              <button className={`login-form__submit${error ? " login-form__submit--error" : ""}`} type="submit" disabled={isSubmitting}>
                <span>{isSubmitting ? "로그인 중..." : error || "로그인"}</span>
                <FiArrowRight aria-hidden="true" />
              </button>
            </form>

            <div className="login-panel__signup">
              <span>아직 계정이 없으신가요?</span>
              <Link to="/signup">계정 생성</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;

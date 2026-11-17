import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { reload, sendEmailVerification, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { FiArrowLeft, FiArrowRight, FiMail } from "react-icons/fi";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { auth } from "../firebase";
import "../styles/Login.css";
import "../styles/VerifyEmail.css";

const VerifyEmail = () => {
  const [user, loading] = useAuthState(auth);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mailSent = (location.state as { mailSent?: boolean } | null)?.mailSent;

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerified) {
    return <Navigate to="/home-preview" replace />;
  }

  const handleCheck = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setMessage("");

    try {
      await reload(user);
      if (user.emailVerified) {
        await user.getIdToken(true);
        navigate("/home-preview", { replace: true });
      } else {
        setIsError(true);
        setMessage("아직 이메일 인증이 완료되지 않았습니다. 메일의 링크를 확인해 주세요.");
      }
    } catch {
      setIsError(true);
      setMessage("인증 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    if (isSending) return;
    setIsSending(true);
    setMessage("");

    try {
      auth.languageCode = "ko";
      await sendEmailVerification(user);
      setIsError(false);
      setMessage("인증 메일을 다시 보냈습니다. 받은편지함에 없다면 스팸함도 확인해 주세요.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof FirebaseError && error.code === "auth/too-many-requests"
        ? "요청이 많습니다. 잠시 후 다시 시도해 주세요."
        : "인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  return (
    <div className="login-page verify-page">
      <div className="login-page__background" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" disablePictureInPicture>
          <source src={`${import.meta.env.BASE_URL}images/home/home.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}images/home/home.mp4`} type="video/mp4" />
        </video>
      </div>

      <div className="login-shell verify-shell">
        <section className="login-panel" aria-labelledby="verify-title">
          <Link className="login-panel__back" to="/home-preview">
            <FiArrowLeft aria-hidden="true" /> 홈으로 돌아가기
          </Link>
          <div className="verify-content">
            <span className="verify-content__icon" aria-hidden="true"><FiMail /></span>
            <h1 id="verify-title">이메일을 인증해 주세요</h1>
            <p><strong>{user.email}</strong> 주소로 인증 메일을 {mailSent === false ? "보내지 못했습니다." : "보냈습니다."}</p>
            <p>{mailSent === false
              ? "아래에서 인증 메일을 다시 보내 주세요."
              : "메일의 링크를 누른 뒤 아래 버튼으로 인증 상태를 확인해 주세요."}</p>
            {mailSent !== false && <p>메일이 보이지 않는다면 스팸함도 확인해 주세요.</p>}

            {message && <p className={isError ? "verify-content__message verify-content__message--error" : "verify-content__message"} role={isError ? "alert" : "status"}>{message}</p>}

            <button className="login-form__submit verify-content__check" type="button" onClick={handleCheck} disabled={isChecking}>
              <span>{isChecking ? "확인 중..." : "인증 완료했어요"}</span>
              <FiArrowRight aria-hidden="true" />
            </button>
            <div className="verify-content__actions">
              <button type="button" onClick={handleResend} disabled={isSending}>
                {isSending ? "보내는 중..." : "인증 메일 다시 보내기"}
              </button>
              <button type="button" onClick={handleSignOut}>다른 계정으로 로그인</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VerifyEmail;

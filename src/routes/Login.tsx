import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

/**
 * 관리자 로그인을 위한 컴포넌트입니다.
 *
 * @component
 * @example
 * <Login />
 *
 * @returns {JSX.Element} 로그인 페이지 컴포넌트
 *
 * @description
 * 이메일과 비밀번호를 입력받아 Firebase 인증을 통해 로그인을 시도합니다.
 * 로그인 성공 시 관리자 페이지로 이동하며, 실패 시 오류 메시지를 표시합니다.
 *
 * @function
 * @name Login
 *
 * @property {string} email - 사용자가 입력한 이메일
 * @property {string} password - 사용자가 입력한 비밀번호
 * @property {string} error - 로그인 실패 시 표시할 오류 메시지
 *
 * @hook
 * @name useState
 * @description 이메일, 비밀번호, 오류 메시지를 상태로 관리합니다.
 *
 * @hook
 * @name useNavigate
 * @description 로그인 성공 시 관리자 페이지로 이동하기 위해 사용합니다.
 *
 * @async
 * @function
 * @name handleSubmit
 * @param {React.FormEvent} e - 폼 제출 이벤트
 * @description 폼 제출 시 Firebase 인증을 통해 로그인을 시도합니다.
 *
 * @returns {Promise<void>}
 */
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin");
    } catch (error) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>관리자 로그인</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group-login">
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group-login">
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">
          로그인
        </button>
      </form>
    </div>
  );
};

export default Login;

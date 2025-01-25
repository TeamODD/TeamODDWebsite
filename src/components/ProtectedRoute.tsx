import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import Loading from "./Loading";

/**
 * 인증된 사용자만 접근할 수 있는 보호된 라우트를 나타내는 컴포넌트입니다.
 *
 * @param {Object} props - 컴포넌트의 속성입니다.
 * @param {React.ReactNode} props.children - 보호된 라우트 내에 렌더링될 자식 요소입니다.
 * @returns {JSX.Element} 인증 상태에 따라 로딩 화면, 로그인 페이지 리디렉션 또는 자식 요소를 반환합니다.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

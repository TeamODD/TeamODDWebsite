import "../styles/Join.css";

const Join = () => {
  return (
    <div className="join-container">
      <div className="join-content">
        <h2 className="join-title">모집 일정</h2>
        <p className="join-text">2025-1 모집을 기다려 주세요!</p>
        <button
          className="join-button"
          onClick={() => {
            if (import.meta.env.VITE_CLUB_JOIN_URL === "") {
              alert("현재 모집기간이 아닙니다.");
            } else {
              window.open(import.meta.env.VITE_CLUB_JOIN_URL, "_blank");
            }
          }}
        >
          지원하기
        </button>
        <ul className="join-rules">
          <li>
            TeamODD는 원칙적으로 연 1회, 1학기 초(3월)에 부원을 모집하고
            있습니다. 다만 특정 파트 인원이 부족할 시 추가 모집이 이루어질 수
            있습니다.
          </li>
          <li>
            에브리타임과 TeamODD의 인스타그램에서 신입부원 모집 소식을 확인하실
            수 있습니다.
          </li>
          <li>
            TeamODD는 게임 개발 동아리로, 게임 개발에 관심과 열의를 가지고 있는
            부원을 환영합니다.
          </li>
          <li>
            연 2회 진행되는 정규 프로젝트에 적어도 1회는 반드시 참여하셔야
            합니다.(졸업학년, 군휴학 등의 경우 예외)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Join;

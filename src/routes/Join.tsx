import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";
import { database } from "../firebase";
import "../styles/Join.css";
import GradientButton from "../components/GradientButton";

const Join = () => {
  const [joinLink, setJoinLink] = useState<string>("");

  useEffect(() => {
    const joinLink = async () => {
      try {
        const linkRef = ref(database, "join");
        const linkSnapshot = await get(linkRef);

        if (linkSnapshot.exists()) {
          setJoinLink(linkSnapshot.val());
        }
      } catch (error) {
        console.error("모집 링크를 가져오는 중 오류 발생:", error);
      }
    };

    joinLink();
  }, []);

  return (
    <div className="join-container">
      <div className="join-content">
        <h2 className="join-title">모집 일정</h2>
        <p className="join-text">2025-1 신입 부원 모집 중입니다!</p>
        <div className="join-button">
          <GradientButton
            innerText="지원하기"
            onClick={() => {
              if (joinLink === "") {
                alert("현재 모집기간이 아닙니다.");
              } else {
                window.open(joinLink, "_blank");
              }
            }}
          />
        </div>
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
            학기마다 활동 조건 달성 시 비교과 포인트를 얻으실 수 있습니다.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Join;

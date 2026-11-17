import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { Link } from "react-router-dom";
import { database } from "../firebase";
import { useMemberRole } from "../auth/useMemberRole";
import "../styles/ModernPages.css";

export default function Join(){
  const [joinLink,setJoinLink] = useState("");
  const {role} = useMemberRole();
  useEffect(()=>{
    if(role==="guest") {setJoinLink("");return;}
    return onValue(ref(database,"join"),s=>setJoinLink(typeof s.val()==="string"?s.val():""));
  },[role]);
  return <div className="modern-page"><header className="modern-page__hero"><span>JOIN TEAM ODD</span><h1>가입안내</h1><p>게임 개발에 관심과 열의가 있는 분을 기다립니다.</p></header><div className="modern-card-grid"><section className="modern-panel"><h2>모집 안내</h2><p>Team ODD는 주로 1학기 초에 신입 부원을 모집하며, 상황에 따라 추가 모집할 수 있습니다. 모집 소식은 공식 채널에서 확인해 주세요.</p>{role==="guest" ? <p className="modern-note">신청 폼은 이메일 인증을 마친 계정에 공개됩니다. <Link to="/login">로그인하기 →</Link></p> : joinLink ? <a className="modern-action" href={joinLink} target="_blank" rel="noopener noreferrer">부원 신청 폼 열기 ↗</a> : <p className="modern-note">현재 등록된 신청 링크가 없습니다.</p>}</section><section className="modern-panel"><h2>활동 안내</h2><p>기획, 아트, 프로그래밍 등 각자의 역할로 프로젝트를 함께 만듭니다. 부원 계정은 가입 후 운영진의 승인을 받아야 활성화됩니다.</p><Link className="modern-action" to="/operations">운영안내 보기 →</Link></section></div></div>;
}

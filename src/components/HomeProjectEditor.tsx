import { useEffect, useState } from "react";
import { onValue, ref, remove, set, update } from "firebase/database";
import { database } from "../firebase";
import { homeProjectPages, type HomeProjectPage, type HomeProjectTile } from "../data/homeProjectPages";
import type { Game } from "../types/game";

const blank = ():HomeProjectPage => ({id:"",columns:3,rows:2,projects:[]});
export default function HomeProjectEditor({games}:{games:Record<string,Game>}) {
  const [pages,setPages] = useState<HomeProjectPage[]>(homeProjectPages);
  const [isRemote,setIsRemote] = useState(false);
  const [draft,setDraft] = useState<HomeProjectPage>(blank);
  const [message,setMessage] = useState("");
  useEffect(()=>onValue(ref(database,"homeProjectPages"),s=>{
    const remote=s.val() as Record<string,HomeProjectPage>|null;
    setIsRemote(Boolean(remote));
    setPages(remote?Object.entries(remote).map(([id,page])=>({...page,id})):homeProjectPages);
  }),[]);
  const save = async () => {
    if(!draft.projects.length){setMessage("프로젝트를 한 개 이상 추가해 주세요.");return;}
    const occupied=new Set<string>();
    for(const tile of draft.projects){
      if(!Object.values(games).some(game=>Number(game.id)===Number(tile.projectId))){setMessage("등록된 프로젝트를 선택해 주세요.");return;}
      for(let row=tile.row;row<tile.row+(tile.rowSpan||1);row++)for(let column=tile.column;column<tile.column+(tile.columnSpan||1);column++){
        const cell=`${row}:${column}`;
        if(row<1||row>draft.rows||column<1||column>draft.columns||occupied.has(cell)){setMessage("카드 위치가 겹치거나 페이지 범위를 벗어났습니다.");return;}
        occupied.add(cell);
      }
    }
    const id=draft.id||String(Date.now());
    try{await set(ref(database,`homeProjectPages/${id}`),{columns:draft.columns,rows:draft.rows,projects:draft.projects});setDraft(blank());setMessage("홈 프로젝트 페이지를 저장했습니다.");}
    catch{setMessage("저장하지 못했습니다. 배치 정보를 확인해 주세요.");}
  };
  const addTile=()=>setDraft({...draft,projects:[...draft.projects,{projectId:Number(Object.values(games)[0]?.id)||0,column:1,row:1}]});
  const setTile=(index:number,patch:Partial<HomeProjectTile>)=>setDraft({...draft,projects:draft.projects.map((tile,i)=>i===index?{...tile,...patch}:tile)});
  return <><section className="modern-panel"><h2>{draft.id?"홈 프로젝트 페이지 수정":"홈 프로젝트 페이지 추가"}</h2><p>각 페이지의 행·열과 카드 위치를 설정합니다. 여러 페이지는 5초마다 자동 전환됩니다.</p><div className="modern-form modern-form--grid"><label>열 수<input type="number" min="1" max="6" value={draft.columns} onChange={e=>setDraft({...draft,columns:Number(e.target.value)})}/></label><label>행 수<input type="number" min="1" max="6" value={draft.rows} onChange={e=>setDraft({...draft,rows:Number(e.target.value)})}/></label></div>{draft.projects.map((tile,index)=><div className="modern-tile" key={index}><label>프로젝트<select value={tile.projectId} onChange={e=>setTile(index,{projectId:Number(e.target.value)})}>{Object.values(games).map(game=><option key={game.id} value={game.id}>{game.title}</option>)}</select></label>{(["column","row","columnSpan","rowSpan"] as const).map(field=><label key={field}>{({column:"열 위치",row:"행 위치",columnSpan:"열 크기",rowSpan:"행 크기"})[field]}<input type="number" min="1" max="6" value={tile[field]||1} onChange={e=>setTile(index,{[field]:Number(e.target.value)})}/></label>)}<label>태그<input value={tile.tag?.label||""} onChange={e=>setTile(index,{tag:e.target.value?{label:e.target.value,color:tile.tag?.color||"gold"}:undefined})}/></label><label>태그 색<select value={tile.tag?.color||"gold"} onChange={e=>setTile(index,{tag:{label:tile.tag?.label||"",color:e.target.value as NonNullable<HomeProjectTile["tag"]>["color"]}})}>{[["gold","금색"],["silver","은색"],["bronze","동색"],["blue","파란색"],["purple","보라색"]].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button onClick={()=>setDraft({...draft,projects:draft.projects.filter((_,i)=>i!==index)})}>카드 제거</button></div>)}<div className="modern-form__actions"><button onClick={addTile} disabled={!Object.keys(games).length}>카드 추가</button><button onClick={()=>void save()}>페이지 저장</button>{draft.id&&<button onClick={()=>setDraft(blank())}>취소</button>}</div>{message&&<p role="status">{message}</p>}</section><section className="modern-panel"><h2>현재 홈 프로젝트 페이지</h2>{!isRemote&&<button className="modern-action" onClick={()=>void update(ref(database),Object.fromEntries(homeProjectPages.map(page=>[`homeProjectPages/${page.id}`,{columns:page.columns,rows:page.rows,projects:page.projects}])))}>현재 기본 구성을 편집 목록으로 가져오기</button>}{pages.map((page,index)=><div className="modern-row" key={page.id}><strong>{index+1}페이지 · {page.columns}열 × {page.rows}행</strong><span>{page.projects.length}개 카드</span><button onClick={()=>{setDraft(page);window.scrollTo(0,0);}}>수정</button>{isRemote&&<button onClick={()=>void remove(ref(database,`homeProjectPages/${page.id}`))}>삭제</button>}</div>)}</section></>;
}

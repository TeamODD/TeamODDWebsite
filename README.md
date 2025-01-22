# TEAMODD 게임 목록 사이트

## 게임 추가 방법

0. public/images/games/ 에 해당 게임 썸네일 이미지를 넣는다(jpg, png등 상관없으나 가급적 **webp**확장자로 해주시기 바랍니다.)
1. https://teamodd.pages.dev/admin 으로 접속
2. 로그인 창이 나온다.
3. 팀오드 구글 계정(이메일, 비번)을 치고 로그인
4. 게임을 추가, 삭제 할 수 있는 관리자 페이지가 나온다.

### 게임추가 각 항목 설명

- 제목 : 게임의 제목
- 설명 : 게임의 간단한 설명(한 문장 정도)(`//n`입력시 줄바꿈 가능)
- 연도 : 게임이 만들어진 연도
- 프로젝트 : 게임이 만들어진 프로젝트 이름(예: 제n회 게임잼, 정규 프로젝트 ... )
- 이미지 URL : 썸네일 이미지 경로. `images/games/아까넣은썸네일이미지이름.webp`(확장자까지 같이 적어야 합니다.)
- 게임 링크 : 게임 다운로드 링크(예: 구글드라이브, (출시했을경우)스팀 페이지, itch.io 페이지 등)
- 개발자 : 개발자 이름들(띄어쓰기로 구분)
- Placeholder(필수X) : 아래 항목 참고

---

### Placeholder만들기

Placeholder란?\
-> 이미지, 텍스트 같은거 로딩중일때 임시로 채워넣는 거.\
(인스타, 트위터 이미지 로딩중일때 뿌연 이미지가 그거임)\
여기서는 게임 썸네일 로딩시에 채워넣는 블러 처리한 썸네일을 사용\
없어도 문제는 안생기지만 있으면 좋음

만드는법

1. https://blurha.sh/ << 접속
2. 밑으로 내리면 파란색 업로드 버튼 있음. 원하는 썸네일 이미지 업로드.
3. 업로드 하면 중간에 `LEHV6nWB...` << 이런 이상한 거 나옴.
4. 복사 후 **Placeholder** 항목에다 넣어주면 됨

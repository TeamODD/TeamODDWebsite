# TEAMODD 게임 목록 사이트

## 게임 추가 방법

1. `main`브랜치에서 작업한다. `gh-pages`브랜치는 건들면 X
   
2. 원하는 썸네일 이미지를 `public/images/games/`에 넣는다.\
   -> 되도록 .png, .jpg보다는 **.webp**로 넣는 것이 좋습니다.(이유 : 로딩 적게 걸림)\
   webp변환 사이트 : https://squoosh.app/
   
4. `src/data/games.json`을 찾는다.
5. 다음 예시를 참고하여 게임 정보를 추가 한다.
6. 저장 후 터미널에서 `npm run deploy`실행
7. 몇 분뒤 실제 사이트에 반영

---

id: 게임 구분을 위한 고유 번호\
 title: 게임 제목\
 description: 1~2줄 정도의 게임 간단 설명. \n을 넣어 줄바꿈 가능\
 year: 제작 연도\
 project: 어떤 프로젝트에서 만들었는지 (예시: 제1회 게임잼, 2024 하계 정규 프로젝트)\
 imageUrl: 위에서 넣은 이미지 경로. **무조건 `images/games/이미지이름.jpg(.png, .webp ...)` 로 작성**\
 link: 게임 다운로드 링크\
 developer: 개발 참여 인원 이름\
 placeholder: 플레이스 홀더. HashCode가 들어감. 자세한건 후술

예시

```json
{
  "id": 9,
  "title": "토끼굴 속으로",
  "description": "<제1회 게임잼 3등작>\n토끼를 찾아 어두운 숲으로",
  "year": "2024",
  "project": "제1회 게임잼",
  "imageUrl": "images/games/rabbithole.webp",
  "link": "https://drive.google.com/file/d/1WnUyXqBJ4ekabDyCW7hQRUaTY_qC1Ymw/view?usp=drive_link",
  "developer": "정보연 정한웅 김영찬 김지아",
  "placeholder": "L238-$W94mxwDzs=-tNDIQaw%6og"
}
```

복붙용 템플릿

```json
    {
      "id": ,
      "title": "",
      "description": "",
      "year": "",
      "project": "",
      "imageUrl": "images/games/",
      "link": "",
      "developer": "",
      "placeholder": ""
    },
```

---

### placeholder만들기

placeholder란?\
-> 이미지, 텍스트 같은거 로딩중일때 임시로 채워넣는 거. 여기서는 게임 썸네일 로딩시에 채워넣는 블러 처리한 썸네일을 사용\
없어도 문제는 안생기지만 있으면 좋음

만드는법

1. https://blurha.sh/ << 접속
2. 밑으로 내리면 파란색 업로드 버튼 있음. 썸네일 이미지 업로드.
3. 업로드 하면 중간에 `LEHV6nWB...` << 이런 이상한 거 나옴.
4. 복사 후 `"placeholder": "여기다 붙여넣기"`

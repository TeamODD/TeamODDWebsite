# TEAMODD 게임 목록 사이트

## 게임 추가 방법
1. 원하는 썸네일 이미지를 `public/images/`에 넣는다.
2. `src/data/games.json`을 찾는다.
3. 다음 예시를 참고하여 게임 정보를 추가 한다.

예시
```json
    {
      "id": 9, --> 다른 게임과 다르게 설정
      "title": "토끼굴 속으로",
      "description": "<제1회 게임잼 3등작>\n토끼를 찾아 어두운 숲으로", --> 줄바꿈시 \n 넣으시면 됩니다.
      "year": "2024",
      "project": "제1회 게임잼",
      "imageUrl": "images/rabbithole.png", --> **중요** "public/images/rabbithole.png" 가 아님!!! "public/" 빼야함
      "link": "https://drive.google.com/file/d/1WnUyXqBJ4ekabDyCW7hQRUaTY_qC1Ymw/view?usp=drive_link", ---> 게임 다운 링크
      "developer": "정보연 정한웅 김영찬 김지아",
      "placeholder": "L238-$W94mxwDzs=-tNDIQaw%6og" ---> 비워놓아도 OK, 자세한건 후술
    }
```

4. 저장 후 터미널에서 `npm run deploy`실행
5. 몇 분뒤 실제 사이트에 반영

---

### placeholder만들기

placeholder란? -> 이미지, 텍스트 같은거 로딩중일때 임시로 채워넣는 거. 여기서는 썸네일 로딩시에 채워넣는 것임

만드는법
1. https://blurha.sh/ << 접속
2. 밑으로 내리면 파란색 업로드 버튼 있음. 썸네일 이미지 업로드.
3. 업로드 하면 중간에 `LEHV6nWB...` << 이런 이상한 거 나옴.
4. 복사 후 `"placeholder": "여기다 붙여넣기"`

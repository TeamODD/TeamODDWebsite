# TEAMODD 게임 목록 사이트

## 게임 추가 방법

1. `src/data/games.json`을 찾는다.
2. 원하는 이미지를 `public/images/`에 넣는다.
3. 다음 형식에 맞게 게임 정보를 추가 한다.

```json
    {
      "id": 1, ---> 다른 게임과 겹치지 않게 설정
      "title": "게임 제목",
      "description": "게임 설명",
      "year": "게임 제작 연도(예: 2024)",
      "project": "프로젝트 이름(예: 제1회 게임잼)",
      "imageUrl": "이미지 경로(images/XXXX.png)", --> public/ <-이건 빼야함!
      "link": "다운 받을 수 있는 링크",
      "developer": "개발자 이름"
    },
```

4. 저장 후 터미널에서 `npm run deploy`실행
5. 몇 분뒤 실제 사이트에 반영

# TEAMODD 게임 목록 사이트

## 게임 추가 방법

1. `src/data/games.json`을 찾는다.
2. 원하는 이미지를 `public/images/`에 넣는다.
3. 다음 형식에 맞게 게임 정보를 추가 한다.

```json
    {
      "id": 1,
      "title": "게임 제목",
      "description": "게임 설명",
      "imageUrl": "이미지 경로(images/XXXX.png)", --> ***public/ <-이건 빼야함!
      "platform": "호환 플랫폼", ---> ***비워도 됨
      "link": "다운 받을 수 있는 링크",
      "developer": "개발자 이름"
    },
```
호환 플랫폼은 작성안해도 무관.
4. 커밋 -> 푸쉬

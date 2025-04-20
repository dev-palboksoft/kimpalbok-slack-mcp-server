# 김팔복TV의 Slack MCP Server 예제

이 저장소는 김팔복TV에서 사용하는 Slack MCP(Model Context Protocol) 서버의 예제 코드입니다. Slack 워크스페이스와 연동하여 다양한 채널/메시지/사용자 관련 기능을 제공합니다.

## 주요 기능

- 워크스페이스의 공개 또는 사전 정의된 채널 목록 조회
- 채널에 메시지 게시 및 스레드 답장
- 메시지에 이모지 반응 추가
- 채널 메시지 히스토리 및 스레드 답글 조회
- 워크스페이스 사용자 및 프로필 정보 조회

## 설치 및 빌드

```bash
{
  "mcpServers": {
    "kimpalbok-slack-mcp-server": {
        "command": "npx",
        "args": [
            "-y",
            "kimpalbok-slack-mcp-server"
        ]
    },
    "env": {
        "SLACK_BOT_TOKEN": "",
        "SLACK_TEAM_ID": ""
    }
}
```


## 환경 변수 설정

실행 전 아래 환경 변수를 반드시 설정해야 합니다.

- `SLACK_BOT_TOKEN` : Slack 봇 토큰 (ex. `xoxb-...`)
- `SLACK_TEAM_ID` : Slack 워크스페이스 팀 ID (ex. `T12345678`)
- (선택) `SLACK_CHANNEL_IDS` : 사전 정의된 채널 ID 목록 (쉼표로 구분)

예시:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_TEAM_ID=T12345678
export SLACK_CHANNEL_IDS=C12345678,C23456789
```


## 사용 예시

서버는 MCP 프로토콜을 통해 다양한 도구(tool)를 제공합니다.  
아래는 지원하는 주요 도구와 설명입니다.

| 도구 이름 | 설명 |
|-----------|------|
| slack_list_channels | 워크스페이스의 공개 또는 사전 정의된 채널 목록 조회 |
| slack_post_message | 채널에 새 메시지 게시 |
| slack_reply_to_thread | 특정 메시지 스레드에 답장 |
| slack_add_reaction | 메시지에 이모지 반응 추가 |
| slack_get_channel_history | 채널에서 최근 메시지 가져오기 |
| slack_get_thread_replies | 메시지 스레드의 모든 답장 가져오기 |
| slack_get_users | 워크스페이스의 모든 사용자와 기본 프로필 정보 가져오기 |
| slack_get_user_profile | 특정 사용자의 상세 프로필 정보 가져오기 |

각 도구의 입력 파라미터와 반환값은 코드의 `Tool` 정의 및 TypeScript 타입을 참고하세요.

## 참고

- 본 서버는 MCP(Model Context Protocol) 기반의 서버로, 표준 입력/출력(stdio) 기반 트랜스포트로 동작합니다.
- 실제 Slack API 연동을 위해서는 올바른 권한의 Slack 봇 토큰이 필요합니다.

---

문의: [김팔복TV](https://www.youtube.com/@kimpalbok)
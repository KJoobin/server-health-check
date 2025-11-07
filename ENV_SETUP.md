# 환경 변수 설정 가이드

## 빠른 시작

1. `env.example` 파일을 `.env.local`로 복사하세요:
```bash
cp env.example .env.local
```

2. `.env.local` 파일을 열어서 필요한 값들을 설정하세요.

## 필수 환경 변수

### HEALTH_CHECK_ENDPOINTS (필수)

모니터링할 GraphQL 엔드포인트 목록입니다. **이 변수는 필수입니다.**

**형식 1: 쉼표로 구분**
```env
HEALTH_CHECK_ENDPOINTS=https://dev-api.athletec.co.kr/graphql,https://field-link-api.athletec.co.kr/graphql
```

**형식 2: JSON 배열**
```env
HEALTH_CHECK_ENDPOINTS=["https://dev-api.athletec.co.kr/graphql","https://field-link-api.athletec.co.kr/graphql"]
```

**주의**: 이 환경 변수를 설정하지 않으면 모니터링이 시작되지 않습니다.

### SLACK_WEBHOOK_URL

슬랙 알림을 받기 위한 웹훅 URL입니다. (선택사항이지만 권장)

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## 슬랙 웹훅 URL 생성 방법

1. [Slack API](https://api.slack.com/apps)에 접속합니다.
2. "Create New App" 버튼을 클릭합니다.
3. "From scratch"를 선택합니다.
4. 앱 이름과 워크스페이스를 선택합니다.
5. 왼쪽 메뉴에서 "Incoming Webhooks"를 클릭합니다.
6. "Activate Incoming Webhooks"를 활성화합니다.
7. "Add New Webhook to Workspace" 버튼을 클릭합니다.
8. 알림을 받을 채널을 선택합니다.
9. 생성된 웹훅 URL을 복사합니다.
10. `.env.local` 파일의 `SLACK_WEBHOOK_URL`에 붙여넣습니다.

## 선택적 환경 변수

### NEXT_PUBLIC_BASE_URL

프로덕션 배포 시 서버의 기본 URL을 설정합니다. (선택사항)

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요. (이미 .gitignore에 포함되어 있습니다)
- 환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다.
- `SLACK_WEBHOOK_URL`을 설정하지 않으면 슬랙 알림이 전송되지 않습니다.
- 모든 환경 변수는 서버 사이드에서만 접근 가능하므로 클라이언트에 노출되지 않습니다.


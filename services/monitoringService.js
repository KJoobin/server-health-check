import { checkServerHealth } from './healthCheckService';
import axios from 'axios';

// 서버 사이드에서 상태 저장 (인메모리)
// 프로덕션에서는 Redis나 DB를 사용하는 것을 권장
let healthStatuses = {};
let checkHistories = {};
let errorPeriods = {}; // { endpoint: { startTime: Date, endTime: Date | null }[] }
let lastErrorNotifications = {}; // { endpoint: Date }

/**
 * 헬스체크 수행 및 상태 업데이트
 */
export async function performHealthCheck() {
  // 환경 변수에서 엔드포인트 목록 가져오기
  const endpointsEnv = process.env.HEALTH_CHECK_ENDPOINTS;
  
  if (!endpointsEnv) {
    console.error('HEALTH_CHECK_ENDPOINTS 환경 변수가 설정되지 않았습니다.');
    return;
  }
  
  let endpoints = [];
  try {
    endpoints = JSON.parse(endpointsEnv);
  } catch {
    endpoints = endpointsEnv.split(',').map(ep => ep.trim()).filter(ep => ep);
  }
  
  if (endpoints.length === 0) {
    console.error('HEALTH_CHECK_ENDPOINTS에 유효한 엔드포인트가 없습니다.');
    return;
  }

  // 모든 엔드포인트 체크
  await Promise.all(
    endpoints.map(async (endpoint) => {
      const result = await checkServerHealth(endpoint);
      const now = new Date();
      
      // 상태 업데이트
      healthStatuses[endpoint] = {
        ...result,
        lastChecked: now,
      };
      
      // 히스토리에 추가 (최대 60개만 유지)
      if (!checkHistories[endpoint]) {
        checkHistories[endpoint] = [];
      }
      checkHistories[endpoint] = [result, ...checkHistories[endpoint]].slice(0, 60);
      
      // 에러 기간 추적
      if (!errorPeriods[endpoint]) {
        errorPeriods[endpoint] = [];
      }
      
      const periods = errorPeriods[endpoint];
      const lastPeriod = periods[periods.length - 1];
      
      if (!result.success) {
        // 비정상 상태
        if (!lastPeriod || lastPeriod.endTime) {
          // 새로운 에러 기간 시작
          periods.push({
            startTime: now,
            endTime: null,
          });
        }
        
        // 슬랙 알림 전송
        const lastNotification = lastErrorNotifications[endpoint];
        const shouldNotify = 
          !lastNotification || 
          (now - new Date(lastNotification)) > 5 * 60 * 1000; // 5분
        
        if (shouldNotify) {
          const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
          if (slackWebhookUrl) {
            const errorDuration = lastPeriod && !lastPeriod.endTime
              ? Math.floor((now - new Date(lastPeriod.startTime)) / 1000)
              : 0;
            const minutes = Math.floor(errorDuration / 60);
            const seconds = errorDuration % 60;
            const durationText = minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
            
            sendSlackNotification(result, endpoint, durationText, slackWebhookUrl)
              .then(() => {
                lastErrorNotifications[endpoint] = now;
              })
              .catch((err) => {
                console.error('슬랙 알림 전송 실패:', err);
              });
          }
        }
      } else {
        // 정상 상태
        if (lastPeriod && !lastPeriod.endTime) {
          // 에러 기간 종료
          lastPeriod.endTime = now;
        }
        // 알림 시간 제거
        delete lastErrorNotifications[endpoint];
      }
    })
  );
}

/**
 * 상태 조회
 */
export function getHealthStatuses() {
  return healthStatuses;
}

/**
 * 에러 기간 조회
 */
export function getErrorPeriods() {
  return errorPeriods;
}

/**
 * 히스토리 조회
 */
export function getCheckHistories() {
  return checkHistories;
}

// 슬랙 알림 전송 함수
async function sendSlackNotification(healthCheckResult, serverUrl, errorDuration, webhookUrl) {
  const timestamp = healthCheckResult.timestamp || new Date();
  const formattedTime = new Date(timestamp).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const message = {
    text: '🚨 서버 헬스체크 오류 발생',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 서버 헬스체크 오류 발생',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*서버 URL:*\n${serverUrl}`,
          },
          {
            type: 'mrkdwn',
            text: `*상태 코드:*\n${healthCheckResult.status || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*오류 메시지:*\n${healthCheckResult.message}`,
          },
          {
            type: 'mrkdwn',
            text: `*발생 시간:*\n${formattedTime}`,
          },
          {
            type: 'mrkdwn',
            text: `*비정상 지속 시간:*\n${errorDuration}`,
          },
        ],
      },
    ],
  };

  if (healthCheckResult.error) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*상세 오류:*\n\`\`\`${healthCheckResult.error}\`\`\``,
      },
    });
  }

  await axios.post(webhookUrl, message, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 5000,
  });
}


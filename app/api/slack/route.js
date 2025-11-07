import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * 슬랙 알림 API Route
 * 서버 사이드에서만 슬랙 웹훅 URL에 접근합니다
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { healthCheckResult, serverUrl } = body;

    // 환경 변수에서 슬랙 웹훅 URL 가져오기 (서버 사이드에서만 접근 가능)
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      return NextResponse.json(
        { success: false, message: '슬랙 웹훅 URL이 설정되지 않았습니다' },
        { status: 500 }
      );
    }

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
            ...(healthCheckResult.errorDuration ? [{
              type: 'mrkdwn',
              text: `*비정상 지속 시간:*\n${healthCheckResult.errorDuration}`,
            }] : []),
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

    const response = await axios.post(slackWebhookUrl, message, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    return NextResponse.json({
      success: response.status === 200,
    });
  } catch (error) {
    console.error('슬랙 알림 전송 실패:', error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


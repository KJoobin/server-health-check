import { NextResponse } from 'next/server';

// 전역 모니터링 인터벌 (서버 재시작 시 초기화됨)
// 프로덕션에서는 별도의 서비스나 크론잡을 사용하는 것을 권장
let monitoringInterval = null;

/**
 * 모니터링 시작 API
 * 서버 사이드에서 1분마다 헬스체크 수행
 */
export async function POST() {
  if (monitoringInterval) {
    return NextResponse.json({
      success: true,
      message: '이미 모니터링이 실행 중입니다.',
    });
  }

  // 헬스체크 수행 함수
  const performHealthCheck = async () => {
    try {
      // health-status API를 직접 호출하여 헬스체크 수행
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      try {
        await fetch(`${baseUrl}/api/health-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('헬스체크 수행 실패:', err);
      }
    } catch (error) {
      console.error('헬스체크 수행 실패:', error);
    }
  };

  // 즉시 한 번 실행
  await performHealthCheck();

  // 1분(60초)마다 실행
  monitoringInterval = setInterval(performHealthCheck, 60000);

  return NextResponse.json({
    success: true,
    message: '모니터링이 시작되었습니다.',
  });
}

/**
 * 모니터링 중지 API
 */
export async function DELETE() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    return NextResponse.json({
      success: true,
      message: '모니터링이 중지되었습니다.',
    });
  }

  return NextResponse.json({
    success: false,
    message: '모니터링이 실행 중이 아닙니다.',
  });
}


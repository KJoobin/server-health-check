import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/services/monitoringService';

/**
 * Vercel Cron Job용 헬스체크 API
 * Vercel Cron Jobs에서 1분마다 호출됩니다.
 * 
 * Vercel Cron 설정:
 * vercel.json에 cron 설정 추가 필요
 * 
 * 참고: Vercel Cron Jobs는 내부적으로 호출되므로 외부에서 직접 접근할 수 없습니다.
 * 따라서 별도의 인증이 필요하지 않습니다.
 */
export async function GET(request) {
  try {
    await performHealthCheck();
    return NextResponse.json({
      success: true,
      message: '헬스체크가 수행되었습니다.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('헬스체크 수행 실패:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}


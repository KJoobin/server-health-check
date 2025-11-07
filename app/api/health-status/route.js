import { NextResponse } from 'next/server';
import { performHealthCheck, getHealthStatuses, getErrorPeriods, getCheckHistories } from '@/services/monitoringService';

/**
 * 헬스체크 상태 조회 API
 */
export async function GET() {
  return NextResponse.json({
    statuses: getHealthStatuses(),
    errorPeriods: getErrorPeriods(),
    histories: getCheckHistories(),
  });
}

/**
 * 헬스체크 수행 API (수동 호출용)
 */
export async function POST() {
  try {
    await performHealthCheck();
    return NextResponse.json({
      success: true,
      message: '헬스체크가 수행되었습니다.',
    });
  } catch (error) {
    console.error('헬스체크 수행 실패:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

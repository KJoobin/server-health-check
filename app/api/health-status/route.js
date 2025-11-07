import { NextResponse } from 'next/server';
import { getHealthStatuses, getErrorPeriods, getCheckHistories } from '@/services/monitoringService';

/**
 * 헬스체크 상태 조회 API
 * 실제 API 호출 없이 저장된 상태값만 반환합니다.
 * 헬스체크는 서버 시작 시 자동으로 시작되며, 1분마다 자동으로 수행됩니다.
 */
export async function GET() {
  return NextResponse.json({
    statuses: getHealthStatuses(),
    errorPeriods: getErrorPeriods(),
    histories: getCheckHistories(),
  });
}

import { NextResponse } from 'next/server';

/**
 * 엔드포인트 목록 API Route
 * 서버 사이드에서만 엔드포인트 목록에 접근합니다
 */
export async function GET() {
  try {
    // 환경 변수에서 엔드포인트 목록 가져오기 (서버 사이드에서만 접근 가능)
    // 쉼표로 구분된 문자열 또는 JSON 배열 형식 지원
    const endpointsEnv = process.env.HEALTH_CHECK_ENDPOINTS;
    
    let endpoints = [];
    
    if (endpointsEnv) {
      try {
        // JSON 배열 형식인지 확인
        endpoints = JSON.parse(endpointsEnv);
      } catch {
        // 쉼표로 구분된 문자열인 경우
        endpoints = endpointsEnv.split(',').map(ep => ep.trim()).filter(ep => ep);
      }
    }
    
    // 환경 변수가 없으면 에러 반환
    if (endpoints.length === 0) {
      return NextResponse.json(
        { endpoints: [], error: 'HEALTH_CHECK_ENDPOINTS 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      endpoints,
    });
  } catch (error) {
    console.error('엔드포인트 목록 가져오기 실패:', error.message);
    return NextResponse.json(
      { endpoints: [] },
      { status: 500 }
    );
  }
}


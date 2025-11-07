import { performHealthCheck } from './services/monitoringService';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Vercel 환경에서는 Cron Jobs를 사용하므로 instrumentation에서 자동 시작하지 않음
    // 로컬 개발 환경에서만 자동 시작
    if (process.env.VERCEL !== '1') {
      await startMonitoring();
    } else {
      console.log('📡 Vercel 환경 감지: Cron Jobs를 사용하여 헬스체크를 수행합니다.');
    }
  }
}

async function startMonitoring() {
  console.log('🚀 서버 헬스체크 모니터링 시작 (로컬 개발 환경)...');
  
  // 환경 변수에서 엔드포인트 목록 가져오기
  const endpointsEnv = process.env.HEALTH_CHECK_ENDPOINTS;
  
  if (!endpointsEnv) {
    console.error('❌ HEALTH_CHECK_ENDPOINTS 환경 변수가 설정되지 않았습니다.');
    console.error('   .env.local 파일에 HEALTH_CHECK_ENDPOINTS를 설정해주세요.');
    return;
  }
  
  let endpoints = [];
  try {
    endpoints = JSON.parse(endpointsEnv);
  } catch {
    endpoints = endpointsEnv.split(',').map(ep => ep.trim()).filter(ep => ep);
  }
  
  if (endpoints.length === 0) {
    console.error('❌ HEALTH_CHECK_ENDPOINTS에 유효한 엔드포인트가 없습니다.');
    return;
  }

  console.log(`📡 모니터링 대상 엔드포인트: ${endpoints.length}개`);
  endpoints.forEach((ep, index) => {
    console.log(`   ${index + 1}. ${ep}`);
  });

  // 헬스체크 수행 함수 (직접 함수 호출, API 호출 아님)
  const performCheck = async () => {
    try {
      await performHealthCheck();
    } catch (error) {
      console.error('헬스체크 수행 실패:', error);
    }
  };

  // 즉시 한 번 실행
  await performCheck();

  // 1분(60초)마다 실행
  setInterval(performCheck, 60000);
  
  console.log('✅ 모니터링이 시작되었습니다. (1분마다 자동 체크)');
}


export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 서버 시작 시 모니터링 시작
    await startMonitoring();
  }
}

async function startMonitoring() {
  console.log('🚀 서버 헬스체크 모니터링 시작...');
  
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

  // 헬스체크 수행 함수
  const performHealthCheck = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // health-status API를 호출하여 헬스체크 수행
      try {
        const response = await fetch(`${baseUrl}/api/health-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error('헬스체크 API 호출 실패:', response.status);
        }
      } catch (err) {
        console.error('헬스체크 수행 실패:', err);
      }
    } catch (error) {
      console.error('헬스체크 수행 중 오류:', error);
    }
  };

  // 즉시 한 번 실행
  await performHealthCheck();

  // 1분(60초)마다 실행
  setInterval(performHealthCheck, 60000);
  
  console.log('✅ 모니터링이 시작되었습니다. (1분마다 자동 체크)');
}


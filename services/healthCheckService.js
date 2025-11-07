import axios from 'axios';

/**
 * GraphQL 서버 헬스체크를 수행합니다
 * @param {string} serverUrl - 체크할 GraphQL 서버 URL
 * @returns {Promise<{success: boolean, status: number, message: string, timestamp: Date, serverUrl: string}>}
 */
export const checkServerHealth = async (serverUrl) => {
  const timestamp = new Date();
  const startTime = Date.now();
  
  try {
    console.log('checke server health', serverUrl);
    // GraphQL 엔드포인트에 간단한 introspection 쿼리 전송
    const response = await axios.post(
      serverUrl,
      {
        query: '{ __typename }',
      },
      {
        timeout: 10000, // 10초 타임아웃
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500, // 500 이상만 에러로 처리
      }
    );

    const responseTime = Date.now() - startTime;

    // GraphQL 응답 확인
    const hasData = response.data && (response.data.data || response.data.errors);
    const isSuccess = response.status >= 200 && response.status < 400 && hasData;

    console.log('check server health result', isSuccess);

    return {
      success: isSuccess,
      status: response.status,
      message: isSuccess
        ? 'GraphQL 서버가 정상적으로 응답했습니다'
        : `서버가 ${response.status} 상태 코드를 반환했습니다`,
      timestamp,
      responseTime: `${responseTime}ms`,
      serverUrl,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let message = '알 수 없는 오류가 발생했습니다';
    
    if (error.code === 'ECONNABORTED') {
      message = '서버 응답 시간이 초과되었습니다 (타임아웃)';
    } else if (error.code === 'ECONNREFUSED') {
      message = '서버에 연결할 수 없습니다 (연결 거부)';
    } else if (error.code === 'ENOTFOUND') {
      message = '서버를 찾을 수 없습니다 (DNS 오류)';
    } else if (error.response) {
      // GraphQL 에러 응답도 확인
      if (error.response.data && error.response.data.errors) {
        message = `GraphQL 오류: ${error.response.data.errors[0]?.message || '알 수 없는 오류'}`;
      } else {
        message = `서버가 ${error.response.status} 상태 코드를 반환했습니다`;
      }
    } else if (error.message) {
      message = error.message;
    }

    return {
      success: false,
      status: error.response?.status || 0,
      message,
      timestamp,
      responseTime: `${responseTime}ms`,
      error: error.message,
      serverUrl,
    };
  }
};


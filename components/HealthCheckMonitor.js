'use client';

import React, { useState, useEffect, useRef } from 'react';
import './HealthCheckMonitor.css';

const HealthCheckMonitor = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState({});
  const [errorPeriods, setErrorPeriods] = useState({});
  const [checkHistories, setCheckHistories] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 서버에서 상태 가져오기
  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health-status');
      const data = await response.json();
      
      if (data.statuses) {
        setHealthStatuses(data.statuses);
      }
      
      if (data.errorPeriods) {
        setErrorPeriods(data.errorPeriods);
      }
      
      // 히스토리도 가져오기 (업타임 계산용)
      if (data.histories) {
        setCheckHistories(data.histories);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('상태 가져오기 실패:', error);
      setIsLoading(false);
    }
  };

  // 엔드포인트 목록 가져오기
  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const response = await fetch('/api/endpoints');
        const data = await response.json();
        if (data.endpoints && data.endpoints.length > 0) {
          setEndpoints(data.endpoints);
        }
      } catch (error) {
        console.error('엔드포인트 목록 가져오기 실패:', error);
      }
    };
    fetchEndpoints();
  }, []);

  // 상태 폴링 (10초마다)
  useEffect(() => {
    // 즉시 한 번 가져오기
    fetchHealthStatus();
    
    const interval = setInterval(() => {
      fetchHealthStatus();
    }, 10000); // 10초마다 상태 업데이트

    return () => clearInterval(interval);
  }, []);

  // 시간 포맷팅
  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 현재 문제 상태 확인
  const getCurrentStatus = (endpoint) => {
    const status = healthStatuses[endpoint];
    if (!status) return null;
    return status.success;
  };

  // 문제 기간 포맷팅
  const formatErrorPeriods = (endpoint) => {
    const periods = errorPeriods[endpoint] || [];
    if (periods.length === 0) return null;

    return periods
      .filter((p) => p.startTime) // 시작 시간이 있는 것만
      .map((period) => {
        const start = formatTime(period.startTime);
        const end = period.endTime ? formatTime(period.endTime) : '진행 중';
        return { start, end, isOngoing: !period.endTime };
      });
  };

  // 전체 상태 계산
  const getOverallStatus = () => {
    if (endpoints.length === 0) return null;
    
    const statuses = endpoints.map(ep => getCurrentStatus(ep));
    const allHealthy = statuses.every(s => s === true);
    const allUnhealthy = statuses.every(s => s === false);
    
    if (allHealthy) return 'all-operational';
    if (allUnhealthy) return 'all-down';
    return 'some-issues';
  };

  // 업타임 계산 (간단한 버전)
  const calculateUptime = (endpoint) => {
    const history = checkHistories[endpoint] || [];
    if (history.length === 0) return null;
    
    const successful = history.filter(h => h.success).length;
    const total = history.length;
    const uptime = (successful / total) * 100;
    
    return uptime.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="health-check-monitor">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  const overallStatus = getOverallStatus();
  const overallStatusText = overallStatus === 'all-operational' 
    ? '모든 시스템 정상 작동 중' 
    : overallStatus === 'all-down' 
    ? '모든 시스템에 문제 발생' 
    : '일부 시스템에 문제 발생';

  return (
    <div className="health-check-monitor">
      {/* 전체 상태 요약 */}
      {endpoints.length > 0 && overallStatus && (
        <div className="overall-status">
          <div className="overall-status-header">
            <div className="overall-status-title">시스템 상태</div>
            <div className="overall-status-indicator">
              <div className={`overall-status-dot ${overallStatus}`}></div>
              <div className="overall-status-text">{overallStatusText}</div>
            </div>
          </div>
        </div>
      )}

      <div className="status-summary">
        <h2>서비스 상태</h2>
        <p className="last-update">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </p>
      </div>

      <div className="endpoints-status-container">
        {endpoints.length === 0 ? (
          <div className="no-endpoints">
            엔드포인트가 설정되지 않았습니다.
          </div>
        ) : (
          endpoints.map((endpoint) => {
            const isHealthy = getCurrentStatus(endpoint);
            const errorPeriodsList = formatErrorPeriods(endpoint);
            const status = healthStatuses[endpoint];
            const uptime = calculateUptime(endpoint);

            return (
              <div key={endpoint} className="endpoint-status-card">
                <div className="endpoint-header">
                  <h3 className="endpoint-title">{endpoint}</h3>
                  <div className={`status-badge ${isHealthy === true ? 'healthy' : isHealthy === false ? 'unhealthy' : 'unknown'}`}>
                    {isHealthy === true && 'Operational'}
                    {isHealthy === false && 'Degraded'}
                    {isHealthy === null && 'Checking'}
                  </div>
                </div>

                <div className="status-indicator-section">
                  <div className="status-indicator">
                    <div className={`status-dot ${isHealthy === true ? 'healthy' : isHealthy === false ? 'unhealthy' : 'unknown'}`}></div>
                    <div className="status-label">
                      {isHealthy === true && '정상 작동 중'}
                      {isHealthy === false && '문제 발생'}
                      {isHealthy === null && '확인 중'}
                    </div>
                  </div>
                </div>

                <div className="status-info">
                  {status ? (
                    <>
                      <p className="status-message">{status.message}</p>
                      {status.responseTime && (
                        <p className="response-time">응답 시간: {status.responseTime}</p>
                      )}
                      {status.lastChecked && (
                        <p className="last-checked">
                          마지막 체크: {formatTime(status.lastChecked)}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="status-message">아직 체크되지 않음</p>
                  )}
                </div>

                {/* 업타임 통계 */}
                {uptime && (
                  <div className="uptime-stats">
                    <div className="uptime-stat">
                      <div className="uptime-stat-label">업타임 (최근 60회)</div>
                      <div className="uptime-stat-value">{uptime}%</div>
                    </div>
                  </div>
                )}

                {/* 문제 발생 기간 */}
                {errorPeriodsList && errorPeriodsList.length > 0 && (
                  <div className="error-periods-section">
                    <h4>문제 발생 기간</h4>
                    <ul className="error-periods-list">
                      {errorPeriodsList.map((period, index) => (
                        <li key={index} className="error-period-item">
                          {period.start} ~ {period.end}
                          {period.isOngoing && ' (진행 중)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 현재 문제가 없는 경우 */}
                {isHealthy === true && (!errorPeriodsList || errorPeriodsList.length === 0) && (
                  <div className="no-issues">
                    현재 문제 없음
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HealthCheckMonitor;

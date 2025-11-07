import HealthCheckMonitor from '@/components/HealthCheckMonitor'

export default function Home() {
  return (
    <main className="main-container">
      <header className="app-header">
        <h1>서버 헬스체크 모니터</h1>
        <p>1분마다 자동으로 서버 상태를 확인합니다</p>
      </header>
      <HealthCheckMonitor />
    </main>
  )
}


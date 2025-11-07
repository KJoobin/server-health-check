import './globals.css'

export const metadata = {
  title: '서버 헬스체크',
  description: '서버 헬스체크 모니터링 애플리케이션',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}


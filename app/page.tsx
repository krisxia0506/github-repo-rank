import Link from 'next/link'
import { getRepositoriesWithStats, getLastSyncTime } from '@/lib/services/repository.service'
import { RankingList } from '@/components/RankingList'
import { CyberBackground } from '@/components/CyberBackground'

export const revalidate = 3600 // Revalidate every hour

function formatLastSyncTime(dateString: string | null): { full: string; relative: string } {
  if (!dateString) return { full: '暂无数据', relative: '' }

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  let relative = ''
  if (diffMins < 1) relative = '刚刚'
  else if (diffMins < 60) relative = `${diffMins}分钟前`
  else if (diffHours < 24) relative = `${diffHours}小时前`
  else if (diffDays < 7) relative = `${diffDays}天前`
  else relative = `${diffDays}天前`

  const full = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  return { full, relative }
}

export default async function Home() {
  let repositories: any[] = []
  let error: string | null = null
  let lastSyncTime: string | null = null

  try {
    repositories = await getRepositoriesWithStats()
    lastSyncTime = await getLastSyncTime()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load repositories'
    console.error('Error fetching repositories:', e)
  }

  const lastSyncDisplay = formatLastSyncTime(lastSyncTime)

  return (
    <main className="min-h-screen cyber-grid relative" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1419 50%, #0a0e1a 100%)' }}>
      {/* Dynamic Cyber Background */}
      <CyberBackground />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ff41] rounded-full filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d9ff] rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-[#00ff41]/20 backdrop-blur-sm bg-[#0a0e1a]/80 scan-line">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00ff41]/5 via-transparent to-[#00d9ff]/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* 七牛云 Logo with Glow */}
              {/* <div className="relative group">
                <div className="absolute inset-0 bg-[#00ff41] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                <img
                  src="https://dn-mars-assets.qbox.me/qiniulog/img-slogan-blue-en.png"
                  alt="七牛云"
                  className="h-14 object-contain relative z-10 filter brightness-125"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 65, 0.5))' }}
                />
              </div> */}
              {/* 牛字 Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-[#00ff41] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                <div className="text-4xl font-bold relative z-10 transition-all duration-300 group-hover:scale-110" style={{
                  color: '#00ff41',
                  textShadow: '0 0 10px rgba(0, 255, 65, 0.8), 0 0 20px rgba(0, 255, 65, 0.5), 0 0 30px rgba(0, 217, 255, 0.3)'
                }}>
                  牛
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold glitch-effect" style={{
                  color: '#ffffff',
                  textShadow: '0 0 5px rgba(0, 255, 65, 0.5), 0 0 10px rgba(0, 217, 255, 0.3), 2px 2px 0px rgba(0, 217, 255, 0.5)'
                }}>
                  第四届Hackathon项目排行榜
                </h1>
                <p className="mt-1.5 text-sm tracking-wider uppercase" style={{ color: '#b8c5e0', letterSpacing: '0.2em' }}>
                  <span className="inline-block mr-2" style={{ color: '#00d9ff' }}>&gt;&gt;</span>
                  发现和追踪最具创新力的Hackathon项目
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs px-2 py-1 rounded border" style={{
                    color: '#00ff41',
                    borderColor: '#00ff41',
                    background: 'rgba(0, 255, 65, 0.1)'
                  }}>实时数据</span>
                  <span className="text-xs px-2 py-1 rounded border" style={{
                    color: '#00d9ff',
                    borderColor: '#00d9ff',
                    background: 'rgba(0, 217, 255, 0.1)'
                  }}>自动更新</span>
                  <span className="text-xs px-2 py-1 rounded border flex items-center gap-1.5" style={{
                    color: '#b8c5e0',
                    borderColor: 'rgba(0, 217, 255, 0.3)',
                    background: 'rgba(0, 217, 255, 0.05)'
                  }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
                      background: '#00ff41',
                      boxShadow: '0 0 4px #00ff41'
                    }} />
                    <span>最后更新: {lastSyncDisplay.full}</span>
                    {lastSyncDisplay.relative && (
                      <span style={{ color: '#00ff41' }}>({lastSyncDisplay.relative})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/submit"
              className="group relative px-6 py-2.5 font-bold tracking-wider uppercase transition-all duration-300 text-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%)',
                border: '2px solid #00ff41',
                color: '#00ff41',
                boxShadow: '0 0 15px rgba(0, 255, 65, 0.3), inset 0 0 15px rgba(0, 255, 65, 0.1)'
              }}
            >
              <span className="relative z-10">提交仓库</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 217, 255, 0.2) 100%)',
                  boxShadow: '0 0 25px rgba(0, 255, 65, 0.5), inset 0 0 25px rgba(0, 255, 65, 0.2)'
                }}
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {error ? (
          <div className="relative border rounded-lg p-8 text-center backdrop-blur-sm" style={{
            background: 'rgba(255, 0, 110, 0.1)',
            borderColor: '#ff006e',
            boxShadow: '0 0 20px rgba(255, 0, 110, 0.3), inset 0 0 20px rgba(255, 0, 110, 0.1)'
          }}>
            <div className="text-4xl mb-4" style={{ color: '#ff006e' }}>⚠ ERROR</div>
            <h2 className="text-xl font-bold mb-3 tracking-wider uppercase" style={{ color: '#ff006e' }}>
              系统加载失败
            </h2>
            <p className="text-base mb-2 font-mono" style={{ color: '#f0f0f0' }}>
              {error}
            </p>
            <p className="text-sm mt-4" style={{ color: '#b8c5e0' }}>
              [系统提示] 请确保数据库连接正常并已完成初始化
            </p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="relative border rounded-lg p-16 text-center backdrop-blur-sm scan-line" style={{
            background: 'rgba(0, 217, 255, 0.05)',
            borderColor: '#00d9ff',
            boxShadow: '0 0 30px rgba(0, 217, 255, 0.2), inset 0 0 30px rgba(0, 217, 255, 0.05)'
          }}>
            <div className="text-7xl mb-6 animate-pulse" style={{ color: '#00d9ff' }}>[ ]</div>
            <h2 className="text-3xl font-bold mb-4 neon-text tracking-wider uppercase" style={{ color: '#00ff41' }}>
              数据库为空
            </h2>
            <p className="text-lg mb-8" style={{ color: '#b8c5e0' }}>
              <span style={{ color: '#00d9ff' }}>&gt;&gt;</span> 成为首个提交项目的黑客 <span style={{ color: '#00d9ff' }}>&lt;&lt;</span>
            </p>
            <Link
              href="/submit"
              className="group relative inline-block px-10 py-4 font-bold tracking-wider uppercase transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%)',
                border: '2px solid #00ff41',
                color: '#00ff41',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.4)'
              }}
            >
              <span className="relative z-10">启动提交</span>
            </Link>
          </div>
        ) : (
          <RankingList initialRepositories={repositories} />
        )}
      </div>

      {/* Footer */}
      <footer className="relative border-t backdrop-blur-sm mt-16" style={{
        background: 'rgba(10, 14, 26, 0.8)',
        borderColor: 'rgba(0, 255, 65, 0.2)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center" style={{ color: '#b8c5e0' }}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #00ff41, transparent)' }} />
              <span className="text-sm tracking-widest uppercase font-bold" style={{ color: '#00d9ff' }}>System Status</span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #00ff41, transparent)' }} />
            </div>
            <p className="mb-2 text-base">
              <span className="font-bold" style={{ color: '#00ff41' }}>[实时更新]</span> 数据每5分钟自动同步 <span style={{ color: '#00d9ff' }}>|</span> 排名基于 GitHub 统计数据
            </p>
            <p className="mb-3 text-sm">
              七牛云第四届Hackathon <span style={{ color: '#00d9ff' }}>●</span> 技术栈: Next.js 16 + Supabase + GitHub API
            </p>
            <p className="mt-4">
              <a
                href="https://www.qiniu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border rounded transition-all duration-300 group"
                style={{
                  color: '#00ff41',
                  borderColor: '#00ff41',
                  background: 'rgba(0, 255, 65, 0.05)'
                }}
              >
                <span className="group-hover:tracking-wider transition-all duration-300">了解七牛云</span>
                <span style={{ color: '#00d9ff' }}>&gt;&gt;</span>
              </a>
            </p>
            <p className="mt-6 text-sm" style={{ color: '#a8b2d1' }}>
              Made by <span style={{ color: '#00d9ff', fontWeight: 'bold' }}>@xiajiayi</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

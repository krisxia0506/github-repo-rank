import Link from 'next/link'
import { SubmitForm } from '@/components/SubmitForm'
import { CyberBackground } from '@/components/CyberBackground'

export const metadata = {
  title: '提交仓库 - 七牛云第四届黑客松',
  description: '提交您的黑客松项目到排行榜',
}

export default function SubmitPage() {
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
      <header className="relative border-b border-[#00ff41]/20 backdrop-blur-sm bg-[#0a0e1a]/80 scan-line z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00ff41]/5 via-transparent to-[#00d9ff]/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* 七牛云 Logo with Glow */}
              <div className="relative group">
                <div className="absolute inset-0 bg-[#00ff41] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                <img
                  src="https://dn-mars-assets.qbox.me/qiniulog/img-slogan-blue-en.png"
                  alt="七牛云"
                  className="h-14 object-contain relative z-10 filter brightness-125"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 65, 0.5))' }}
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold glitch-effect" style={{
                  color: '#ffffff',
                  textShadow: '0 0 5px rgba(0, 255, 65, 0.5), 0 0 10px rgba(0, 217, 255, 0.3), 2px 2px 0px rgba(0, 217, 255, 0.5)'
                }}>
                  提交黑客松项目
                </h1>
                <p className="mt-3 text-base tracking-wider uppercase" style={{ color: '#b8c5e0', letterSpacing: '0.2em' }}>
                  <span className="inline-block mr-2" style={{ color: '#00d9ff' }}>&gt;&gt;</span>
                  将您的项目添加到七牛云第四届黑客松排行榜
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="group relative px-8 py-4 font-bold tracking-wider uppercase transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.1) 0%, rgba(0, 255, 65, 0.1) 100%)',
                border: '2px solid #00d9ff',
                color: '#00d9ff',
                boxShadow: '0 0 15px rgba(0, 217, 255, 0.3), inset 0 0 15px rgba(0, 217, 255, 0.1)'
              }}
            >
              <span className="relative z-10">&lt; 返回排行榜</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(0, 255, 65, 0.2) 100%)',
                  boxShadow: '0 0 25px rgba(0, 217, 255, 0.5), inset 0 0 25px rgba(0, 217, 255, 0.2)'
                }}
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <SubmitForm />
      </div>
    </main>
  )
}

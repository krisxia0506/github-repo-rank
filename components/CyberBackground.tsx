'use client'

import { useEffect, useRef } from 'react'

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
      life: number
      maxLife: number

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.color = Math.random() > 0.5 ? '#00ff41' : '#00d9ff'
        this.life = 0
        this.maxLife = Math.random() * 200 + 100
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life++

        // Wrap around screen
        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0

        // Reset if life expired
        if (this.life > this.maxLife) {
          this.life = 0
          this.x = Math.random() * canvas.width
          this.y = Math.random() * canvas.height
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const opacity = 1 - this.life / this.maxLife
        ctx.fillStyle = this.color + Math.floor(opacity * 0.3 * 255).toString(16).padStart(2, '0')
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Create particles
    const particles: Particle[] = []
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle())
    }

    // Matrix rain effect
    const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = []
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize)
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      // Semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(10, 14, 26, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw matrix rain (sparse)
      if (Math.random() > 0.98) {
        ctx.fillStyle = '#00ff41'
        ctx.font = `${fontSize}px monospace`
        for (let i = 0; i < columns; i++) {
          if (Math.random() > 0.95) {
            const text = matrixChars[Math.floor(Math.random() * matrixChars.length)]
            const x = i * fontSize
            const y = drops[i] * fontSize

            ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * 0.3})`
            ctx.fillText(text, x, y)

            if (y > canvas.height && Math.random() > 0.95) {
              drops[i] = 0
            }
            drops[i]++
          }
        }
      }

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update()
        particle.draw(ctx)
      })

      // Draw connections between close particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            const opacity = (1 - distance / 100) * 0.15
            ctx.strokeStyle = `rgba(0, 217, 255, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  )
}

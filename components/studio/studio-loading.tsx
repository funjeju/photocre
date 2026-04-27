'use client'

import { useState, useEffect } from 'react'

const SLIDES = [
  { src: '/style-samples/none.png',        msg: '지금 이미지 만들고 있어요!' },
  { src: '/style-samples/ghibli.png',      msg: '지브리풍으로도 될 수 있어요 🌿' },
  { src: '/style-samples/pixar-3d.png',    msg: '픽사 스타일은 어때요? 🎬' },
  { src: '/style-samples/anime.png',       msg: 'AI가 열심히 그리는 중 🎨' },
  { src: '/style-samples/disney-3d.png',   msg: '쪼끔만 기달려주세요~' },
  { src: '/style-samples/oil-painting.png',msg: '유화 스타일도 귀엽죠? 🖌️' },
  { src: '/style-samples/pencil-sketch.png', msg: '거의 다 됐어요! ✨' },
]

export function StudioLoading() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % SLIDES.length)
        setVisible(true)
      }, 220)
    }, 1500)
    return () => clearInterval(id)
  }, [])

  const slide = SLIDES[idx]

  return (
    <div className="flex flex-col items-center select-none py-6">
      {/* 말풍선 */}
      <div className="relative mb-0">
        <div className="bg-white border border-border/70 rounded-2xl px-5 py-3 shadow-md min-w-[210px]">
          <p
            className="text-sm font-semibold text-center text-foreground leading-snug"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            {slide.msg}
          </p>
          {/* 로딩 점 */}
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent"
                style={{ animation: `studioLoadDot 1.2s ease-in-out ${i * 0.18}s infinite` }}
              />
            ))}
          </div>
        </div>

        {/* 말풍선 꼬리 */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[9px]">
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
            <path d="M0 0 L11 10.5 L22 0" stroke="hsl(var(--border))" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
            <path d="M1 0 L11 10 L21 0" fill="white" />
          </svg>
        </div>
      </div>

      {/* 꼬마 이미지 */}
      <div style={{ animation: 'studioLoadFloat 2.8s ease-in-out infinite' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={slide.src}
          src={slide.src}
          alt="로딩 중"
          className="rounded-2xl shadow-sm"
          style={{
            width: 130,
            height: 140,
            objectFit: 'cover',
            objectPosition: 'center 32%',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        />
      </div>

      <style>{`
        @keyframes studioLoadFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes studioLoadDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

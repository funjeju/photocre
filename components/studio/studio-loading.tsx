'use client'

import { useState, useEffect } from 'react'

const MESSAGES = [
  '지금 이미지 만들고 있어요!',
  'AI가 열심히 그리는 중 🎨',
  '쪼끔만 기달려주세요~',
  '거의 다 됐어요! ✨',
]

export function StudioLoading() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % MESSAGES.length)
        setFade(true)
      }, 250)
    }, 2400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center select-none py-6">
      {/* 말풍선 */}
      <div className="relative mb-0">
        <div className="bg-white border border-border/70 rounded-2xl px-5 py-3 shadow-md min-w-[200px]">
          <p
            className="text-sm font-semibold text-center text-foreground leading-snug transition-opacity duration-250"
            style={{ opacity: fade ? 1 : 0 }}
          >
            {MESSAGES[msgIdx]}
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

        {/* 말풍선 꼬리 (아래쪽) */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[9px]">
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
            <path d="M1 0 L11 10 L21 0" fill="white" />
            <path d="M0 0 L11 10.5 L22 0" stroke="hsl(var(--border))" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
            {/* border 위에 white로 덮어서 하단 테두리만 보이게 */}
            <path d="M1 0 L11 10 L21 0" fill="white" />
          </svg>
        </div>
      </div>

      {/* 여자아이 이미지 */}
      <div style={{ animation: 'studioLoadFloat 2.8s ease-in-out infinite' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/style-samples/none.png"
          alt="로딩 중"
          className="rounded-2xl shadow-sm"
          style={{
            width: 130,
            height: 140,
            objectFit: 'cover',
            objectPosition: 'center 32%',
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

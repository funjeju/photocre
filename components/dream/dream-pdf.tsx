'use client'

import React from 'react'
import type { DreamReport } from '@/app/api/dream/route'

export interface DreamPDFProps {
  imageUrl: string
  report: DreamReport
  career: string
  age: number
}

// ── Inline-style constants (html2canvas can't parse Tailwind/CSS-var) ───────

const C = {
  bg: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  subtle: '#9ca3af',
  border: '#e5e7eb',
  accent: '#3b82f6',
  accentBg: '#eff6ff',
  accentBorder: '#bae6fd',
  tagBg: '#f9fafb',
  tagBorder: '#e5e7eb',
  tagText: '#374151',
  sectionBg: '#f9fafb',
}

const T = {
  brand: { fontSize: 7, color: C.subtle, letterSpacing: 3, marginBottom: 8, fontFamily: 'Arial, sans-serif' },
  headline: { fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 4, fontFamily: 'Arial, sans-serif' },
  career: { fontSize: 12, color: C.muted, fontFamily: 'Arial, sans-serif' },
  label: { fontSize: 9, fontWeight: 700, color: C.subtle, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 8, fontFamily: 'Arial, sans-serif' },
  body: { fontSize: 11, color: C.tagText, lineHeight: 1.7, fontFamily: 'Arial, sans-serif' },
  detail: { fontSize: 10, color: C.muted, lineHeight: 1.65, fontFamily: 'Arial, sans-serif' },
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '16px 0' }} />
}

function Tag({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-block', background: C.tagBg, border: `1px solid ${C.tagBorder}`,
      borderRadius: 20, padding: '4px 12px', fontSize: 10, color: C.tagText,
      fontWeight: 600, margin: '0 4px 6px 0', fontFamily: 'Arial, sans-serif',
    }}>
      {text}
    </span>
  )
}

function PathStep({ num, title, detail }: { num: number; title: string; detail?: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
      <div style={{
        width: 24, height: 24, borderRadius: 12, background: C.accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: 'Arial, sans-serif' }}>{num}</span>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2, fontFamily: 'Arial, sans-serif' }}>{title}</div>
        {detail && <div style={T.detail}>{detail}</div>}
      </div>
    </div>
  )
}

// ── The printable HTML template ───────────────────────────────────────────

export function DreamPDFTemplate({ imageUrl, report, career, age }: DreamPDFProps) {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{
      width: 794, background: C.bg, padding: '40px 44px 52px',
      boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 20 }}>
        <div style={T.brand}>FRAMELAB  ·  DREAM REPORT</div>
        <div style={T.headline}>{report.headline}</div>
        <div style={T.career}>{age}살 · {career}</div>
      </div>

      {/* Hero: image + overview */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ width: 170, height: 170, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" style={{ width: 170, height: 170, objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={T.label}>OVERVIEW</div>
          <div style={T.body}>{report.overview ?? report.summary}</div>
        </div>
      </div>

      <Divider />

      {/* Strengths */}
      <div style={{ marginBottom: 4 }}>
        <div style={T.label}>STRENGTHS · 나의 강점</div>
        <div style={{ marginBottom: 8 }}>
          {report.strengths.map((s, i) => <Tag key={i} text={s} />)}
        </div>
        {report.strengthDetails
          ? report.strengthDetails.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: C.subtle, flexShrink: 0, fontSize: 10, marginTop: 1, fontFamily: 'Arial, sans-serif' }}>›</span>
                <div style={T.detail}>
                  <span style={{ fontWeight: 700, color: C.text }}>{report.strengths[i]}</span>{'  '}{d}
                </div>
              </div>
            ))
          : null}
      </div>

      <Divider />

      {/* Skills */}
      <div style={{ marginBottom: 4 }}>
        <div style={T.label}>SKILLS · 필요 스킬</div>
        <div style={{ marginBottom: 8 }}>
          {report.skills.map((s, i) => <Tag key={i} text={s} />)}
        </div>
        {report.skillDetails
          ? report.skillDetails.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: C.subtle, flexShrink: 0, fontSize: 10, marginTop: 1, fontFamily: 'Arial, sans-serif' }}>›</span>
                <div style={T.detail}>
                  <span style={{ fontWeight: 700, color: C.text }}>{report.skills[i]}</span>{'  '}{d}
                </div>
              </div>
            ))
          : null}
      </div>

      <Divider />

      {/* Career Path */}
      <div style={{ marginBottom: 4 }}>
        <div style={T.label}>CAREER PATH · 커리어 경로</div>
        {report.path.map((step, i) => (
          <PathStep key={i} num={i + 1} title={step} detail={report.pathDetails?.[i]} />
        ))}
      </div>

      {/* Daily Life + Prospects */}
      {(report.dailyLife || report.prospects) && (
        <>
          <Divider />
          <div style={{ display: 'flex', gap: 24, marginBottom: 4 }}>
            {report.dailyLife && (
              <div style={{ flex: 1 }}>
                <div style={T.label}>DAILY LIFE · 하루 일상</div>
                <div style={T.body}>{report.dailyLife}</div>
              </div>
            )}
            {report.prospects && (
              <div style={{ flex: 1 }}>
                <div style={T.label}>PROSPECTS · 미래 전망</div>
                <div style={T.body}>{report.prospects}</div>
              </div>
            )}
          </div>
        </>
      )}

      <Divider />

      {/* Encouragement */}
      <div style={{
        background: C.accentBg, borderRadius: 12, padding: 16,
        border: `1px solid ${C.accentBorder}`, borderLeft: `3px solid ${C.accent}`,
        marginBottom: 16,
      }}>
        <div style={{ ...T.label, color: C.accent, marginBottom: 6 }}>ENCOURAGEMENT</div>
        <div style={{ fontSize: 12, color: '#1e3a5f', lineHeight: 1.7, fontFamily: 'Arial, sans-serif' }}>{report.message}</div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
        <span style={{ fontSize: 8, color: C.subtle, fontFamily: 'Arial, sans-serif' }}>Framelab Dream Report — {career} · {age}살</span>
        <span style={{ fontSize: 8, color: C.subtle, fontFamily: 'Arial, sans-serif' }}>{today}</span>
      </div>
    </div>
  )
}

// ── Download helpers ───────────────────────────────────────────────────────

export async function downloadDreamPDF(props: DreamPDFProps, filename?: string): Promise<void> {
  const { downloadPdfFromElement } = await import('@/lib/downloadPdf')
  const { createRoot } = await import('react-dom/client')

  // Mount the template offscreen
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
  document.body.appendChild(container)

  await new Promise<void>((resolve, reject) => {
    const root = createRoot(container)
    root.render(
      React.createElement(DreamPDFTemplate, props)
    )
    // Wait for images to load before capturing
    setTimeout(async () => {
      try {
        const el = container.firstElementChild as HTMLElement
        if (!el) throw new Error('No element to capture')
        await downloadPdfFromElement({
          element: el,
          filename: filename ?? `dream-${props.career}-${props.age}살.pdf`,
          scale: 2,
        })
        resolve()
      } catch (err) {
        reject(err)
      } finally {
        root.unmount()
        document.body.removeChild(container)
      }
    }, 600)
  })
}

export async function downloadImageFromUrl(src: string, filename: string): Promise<void> {
  if (src.startsWith('data:')) {
    const a = document.createElement('a')
    a.href = src
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return
  }
  const res = await fetch(src)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

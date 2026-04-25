'use client';

import { forwardRef } from 'react';
import type { MagazineTemplate } from '@/lib/presets/magazine-templates';

interface MagazineCanvasProps {
  template: MagazineTemplate;
  images: (string | null)[];  // object URLs
  texts: Record<string, string>;
  scale?: number;
}

// 캔버스 기준 크기 (3:4 비율)
export const CANVAS_W = 1200;
export const CANVAS_H = 1600;

export const MagazineCanvas = forwardRef<HTMLDivElement, MagazineCanvasProps>(
  function MagazineCanvas({ template, images, texts, scale = 1 }, ref) {
    const style: React.CSSProperties = {
      width: CANVAS_W * scale,
      height: CANVAS_H * scale,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Playfair Display", "Noto Serif KR", serif',
      background: '#fff',
      flexShrink: 0,
    };

    return (
      <div ref={ref} style={style}>
        <LayoutRenderer template={template} images={images} texts={texts} scale={scale} />
      </div>
    );
  }
);

function LayoutRenderer({ template, images, texts, scale }: Omit<MagazineCanvasProps, 'scale'> & { scale: number }) {
  const img0 = images[0];
  const img1 = images[1];
  const s = (v: number) => v * scale;

  switch (template.id) {

    case 'cover_full_editorial':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {img0 && <img src={img0} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          {/* 하단 그라데이션 */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
          {/* 우상단 이슈 번호 */}
          <span style={{ position: 'absolute', top: s(48), right: s(52), color: '#fff', fontSize: s(20), letterSpacing: '0.15em', fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
            {texts.meta || 'Vol.01'}
          </span>
          {/* 상단 중앙 타이틀 */}
          <h1 style={{ position: 'absolute', top: s(60), left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: s(96), fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1, margin: 0, textTransform: 'uppercase' }}>
            {texts.title || 'TITLE'}
          </h1>
          {/* 중간 좌측 서브 */}
          {texts.subtitle && (
            <p style={{ position: 'absolute', top: '42%', left: s(52), color: '#fff', fontSize: s(28), fontWeight: 300, letterSpacing: '0.12em', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {texts.subtitle}
            </p>
          )}
          {/* 하단 좌 메타 */}
          <div style={{ position: 'absolute', bottom: s(52), left: s(52), right: s(52), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: s(16), fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em' }}>
              {texts.meta}
            </span>
            {/* 바코드 (장식) */}
            <Barcode scale={scale} />
          </div>
        </div>
      );

    case 'split_left_image_right_text':
      return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <div style={{ width: '50%', height: '100%', flexShrink: 0 }}>
            {img0 && <img src={img0} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ width: '50%', height: '100%', background: '#F5F3EF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${s(80)}px ${s(72)}px` }}>
            <div style={{ width: s(40), height: s(2), background: '#222', marginBottom: s(40) }} />
            <h1 style={{ fontSize: s(60), fontWeight: 600, lineHeight: 1.15, margin: `0 0 ${s(40)}px 0`, color: '#111', whiteSpace: 'pre-line' }}>
              {texts.title || 'Title'}
            </h1>
            <p style={{ fontSize: s(22), lineHeight: 1.7, color: '#555', margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
              {texts.body}
            </p>
          </div>
        </div>
      );

    case 'center_overlay_block':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {img0 && <img src={img0} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '70%', paddingTop: '20%', paddingBottom: '20%', background: 'rgba(20,20,20,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h1 style={{ color: '#fff', fontSize: s(72), fontWeight: 700, letterSpacing: '0.12em', margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>
                {texts.title || 'EDITORIAL'}
              </h1>
            </div>
          </div>
        </div>
      );

    case 'top_typography_minimal':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#fff' }}>
          <div style={{ height: '38%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${s(72)}px` }}>
            <p style={{ fontSize: s(18), letterSpacing: '0.25em', color: '#999', margin: `0 0 ${s(20)}px 0`, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              {texts.subtitle || 'Collection'}
            </p>
            <h1 style={{ fontSize: s(88), fontWeight: 600, lineHeight: 1, margin: 0, color: '#111', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {texts.title || 'PORTRAIT'}
            </h1>
            <div style={{ width: s(64), height: s(2), background: '#111', marginTop: s(36) }} />
          </div>
          <div style={{ flex: 1 }}>
            {img0 && <img src={img0} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
        </div>
      );

    case 'grid_double_image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: s(8), background: '#111', padding: s(8) }}>
          <div style={{ flex: 1, position: 'relative' }}>
            {img0 && <img src={img0} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {texts.caption1 && (
              <span style={{ position: 'absolute', bottom: s(20), left: s(20), color: '#fff', fontSize: s(22), fontFamily: 'Inter, sans-serif', fontWeight: 300, letterSpacing: '0.1em' }}>
                {texts.caption1}
              </span>
            )}
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {img1 && <img src={img1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {texts.caption2 && (
              <span style={{ position: 'absolute', bottom: s(20), left: s(20), color: '#fff', fontSize: s(22), fontFamily: 'Inter, sans-serif', fontWeight: 300, letterSpacing: '0.1em' }}>
                {texts.caption2}
              </span>
            )}
          </div>
        </div>
      );

    case 'cutout_color_bg':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(135deg, #FFE066 0%, #FF6B9D 50%, #C44DFF 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ position: 'absolute', top: s(60), left: 0, right: 0, textAlign: 'center', fontSize: s(88), fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', textShadow: `0 ${s(4)}px ${s(24)}px rgba(0,0,0,0.2)`, margin: 0 }}>
            {texts.title || 'STAR'}
          </h1>
          {img0 && (
            <img src={img0} alt="" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '80%', objectFit: 'contain', filter: `drop-shadow(0 ${s(20)}px ${s(40)}px rgba(0,0,0,0.3))` }} />
          )}
          {texts.badge && (
            <div style={{ position: 'absolute', top: s(160), right: s(60), background: '#fff', color: '#111', borderRadius: '50%', width: s(100), height: s(100), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: s(22), fontWeight: 700, fontFamily: 'Inter, sans-serif', boxShadow: `0 ${s(4)}px ${s(16)}px rgba(0,0,0,0.15)` }}>
              {texts.badge}
            </div>
          )}
        </div>
      );

    case 'dark_luxury_cover':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {img0 && <img src={img0} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          {/* 비네팅 */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
          {/* 상단 타이틀 */}
          <h1 style={{ position: 'absolute', top: s(72), left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: s(96), fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
            {texts.title || 'NOIR'}
          </h1>
          {/* 중간 우측 서브 */}
          {texts.subtitle && (
            <p style={{ position: 'absolute', top: '45%', right: s(56), color: '#ccc', fontSize: s(24), fontWeight: 300, letterSpacing: '0.15em', margin: 0, fontFamily: 'Inter, sans-serif', textAlign: 'right' }}>
              {texts.subtitle}
            </p>
          )}
          {/* 하단 장식선 */}
          <div style={{ position: 'absolute', bottom: s(80), left: s(56), right: s(56), height: s(1), background: 'rgba(255,255,255,0.3)' }} />
        </div>
      );

    case 'side_bar_text':
      return (
        <div style={{ display: 'flex', width: '100%', height: '100%', background: '#EFEFEF' }}>
          <div style={{ width: '70%', height: '100%', flexShrink: 0 }}>
            {img0 && <img src={img0} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ width: '30%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${s(60)}px ${s(48)}px`, borderLeft: `${s(1)}px solid #ddd` }}>
            <div style={{ width: s(24), height: s(3), background: '#222', marginBottom: s(32) }} />
            <h2 style={{ fontSize: s(42), fontWeight: 600, margin: `0 0 ${s(32)}px 0`, color: '#111', lineHeight: 1.2 }}>
              {texts.title || 'Feature'}
            </h2>
            <div style={{ width: '100%', height: s(1), background: '#ccc', marginBottom: s(28) }} />
            <p style={{ fontSize: s(18), lineHeight: 1.9, color: '#444', margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 300, whiteSpace: 'pre-line' }}>
              {texts.list}
            </p>
          </div>
        </div>
      );

    case 'bottom_caption_editorial':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {img0 && <img src={img0} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '26%', background: '#fff', padding: `${s(40)}px ${s(56)}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: s(44), fontWeight: 600, margin: `0 0 ${s(16)}px 0`, color: '#111' }}>
              {texts.title || 'Editorial'}
            </h2>
            <p style={{ fontSize: s(20), lineHeight: 1.6, color: '#666', margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
              {texts.body}
            </p>
          </div>
        </div>
      );

    case 'experimental_poster':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {img0 && <img src={img0} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          {/* 그래픽 도형들 */}
          <div style={{ position: 'absolute', top: s(80), left: s(-80), width: s(400), height: s(400), borderRadius: '50%', border: `${s(4)}px solid rgba(255,255,255,0.5)` }} />
          <div style={{ position: 'absolute', bottom: s(200), right: s(-60), width: s(300), height: s(300), borderRadius: '50%', border: `${s(2)}px solid rgba(255,255,255,0.3)` }} />
          <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, height: s(2), background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />
          <h1 style={{ position: 'absolute', top: s(100), left: s(56), color: '#fff', fontSize: s(80), fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, lineHeight: 1, textShadow: `0 ${s(2)}px ${s(20)}px rgba(0,0,0,0.4)` }}>
            {(texts.title || 'AVANT-GARDE').split('').join('\n').split('\n').map((char, i) => (
              <span key={i} style={{ display: 'block' }}>{char}</span>
            ))}
          </h1>
        </div>
      );

    default:
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#f0f0f0' }}>
          <p style={{ color: '#999', fontFamily: 'Inter, sans-serif' }}>레이아웃 준비 중</p>
        </div>
      );
  }
}

function Barcode({ scale }: { scale: number }) {
  const s = (v: number) => v * scale;
  const bars = Array.from({ length: 28 }, (_, i) => ({
    w: [1,2,1,1,3,1,2,1,1,2,3,1,1,2,1,2,1,1,2,1,3,1,2,1,1,2,1,1][i] ?? 1,
  }));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: s(1.5), opacity: 0.7 }}>
      {bars.map((bar, i) => (
        <div key={i} style={{ width: s(bar.w * 2), height: s(28 + (i % 3) * 4), background: '#fff' }} />
      ))}
    </div>
  );
}

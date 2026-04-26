'use client';

import React from 'react';
import {
  Document, Page, View, Text, Image,
  StyleSheet, Font,
} from '@react-pdf/renderer';
import type { DreamReport } from '@/app/api/dream/route';

export interface DreamPDFProps {
  imageUrl: string;
  report: DreamReport;
  career: string;
  age: number;
}

let fontsRegistered = false;

export function ensureFonts() {
  if (fontsRegistered || typeof window === 'undefined') return;
  const base = window.location.origin;
  Font.register({
    family: 'Pretendard',
    fonts: [
      { src: `${base}/fonts/Pretendard-Regular.woff2`, fontWeight: 400 },
      { src: `${base}/fonts/Pretendard-Bold.woff2`, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const S = StyleSheet.create({
  page: {
    fontFamily: 'Pretendard',
    paddingTop: 38,
    paddingBottom: 52,
    paddingHorizontal: 44,
    backgroundColor: '#ffffff',
    fontSize: 10,
    color: '#1a1a2e',
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 14,
  },
  brandLabel: {
    fontSize: 7,
    color: '#9ca3af',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  headline: {
    fontSize: 19,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.3,
    marginBottom: 4,
  },
  careerText: {
    fontSize: 11,
    color: '#6b7280',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 16,
  },
  heroImageWrap: {
    width: 158,
    height: 158,
    borderRadius: 11,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#f3f4f6',
  },
  heroRight: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 7,
    color: '#9ca3af',
    letterSpacing: 2,
    marginBottom: 6,
  },
  overviewText: {
    fontSize: 9.5,
    color: '#374151',
    lineHeight: 1.65,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 13,
  },
  section: {
    marginBottom: 13,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 0.75,
    borderColor: '#e5e7eb',
  },
  tagText: {
    fontSize: 8.5,
    color: '#374151',
    fontWeight: 600,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 8.5,
    color: '#d1d5db',
    marginTop: 1,
    flexShrink: 0,
  },
  detailLabel: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#111827',
  },
  detailText: {
    fontSize: 9.5,
    color: '#4b5563',
    lineHeight: 1.55,
    flex: 1,
  },
  pathItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  pathNum: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  pathNumText: {
    fontSize: 8.5,
    color: '#3b82f6',
    fontWeight: 700,
  },
  pathBody: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  pathDetail: {
    fontSize: 9.5,
    color: '#6b7280',
    lineHeight: 1.55,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 13,
  },
  col: {
    flex: 1,
  },
  paraText: {
    fontSize: 9.5,
    color: '#374151',
    lineHeight: 1.65,
  },
  messageBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 0.75,
    borderColor: '#bae6fd',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    marginBottom: 14,
  },
  messageLabel: {
    fontSize: 7,
    color: '#3b82f6',
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: 700,
  },
  messageText: {
    fontSize: 10.5,
    color: '#1e3a5f',
    lineHeight: 1.7,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.75,
    borderTopColor: '#f3f4f6',
    paddingTop: 7,
  },
  footerText: {
    fontSize: 7,
    color: '#d1d5db',
  },
});

export function DreamPDFDocument({ imageUrl, report, career, age }: DreamPDFProps) {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Document title={`Dream — ${age}살 ${career}`} author="Framelab" creator="Framelab">
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.brandLabel}>FRAMELAB  DREAM  REPORT</Text>
          <Text style={S.headline}>{report.headline}</Text>
          <Text style={S.careerText}>{age}살 · {career}</Text>
        </View>

        {/* Hero: image + overview */}
        <View style={S.heroRow}>
          <View style={S.heroImageWrap}>
            <Image src={imageUrl} style={{ width: 158, height: 158, objectFit: 'cover' }} />
          </View>
          <View style={S.heroRight}>
            <Text style={S.sectionLabel}>OVERVIEW</Text>
            <Text style={S.overviewText}>{report.overview ?? report.summary}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* Strengths */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>STRENGTHS · 나의 강점</Text>
          <View style={S.tagRow}>
            {report.strengths.map((s, i) => (
              <View key={i} style={S.tag}>
                <Text style={S.tagText}>{s}</Text>
              </View>
            ))}
          </View>
          {report.strengthDetails
            ? report.strengthDetails.map((d, i) => (
                <View key={i} style={S.detailRow}>
                  <Text style={S.bullet}>›</Text>
                  <Text style={S.detailText}>
                    <Text style={S.detailLabel}>{report.strengths[i]}  </Text>
                    {d}
                  </Text>
                </View>
              ))
            : report.strengths.map((s, i) => (
                <View key={i} style={S.detailRow}>
                  <Text style={S.bullet}>›</Text>
                  <Text style={S.detailText}>{s}</Text>
                </View>
              ))}
        </View>

        <View style={S.divider} />

        {/* Skills */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>SKILLS · 필요 스킬</Text>
          <View style={S.tagRow}>
            {report.skills.map((s, i) => (
              <View key={i} style={S.tag}>
                <Text style={S.tagText}>{s}</Text>
              </View>
            ))}
          </View>
          {report.skillDetails
            ? report.skillDetails.map((d, i) => (
                <View key={i} style={S.detailRow}>
                  <Text style={S.bullet}>›</Text>
                  <Text style={S.detailText}>
                    <Text style={S.detailLabel}>{report.skills[i]}  </Text>
                    {d}
                  </Text>
                </View>
              ))
            : report.skills.map((s, i) => (
                <View key={i} style={S.detailRow}>
                  <Text style={S.bullet}>›</Text>
                  <Text style={S.detailText}>{s}</Text>
                </View>
              ))}
        </View>

        <View style={S.divider} />

        {/* Career Path */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>CAREER PATH · 커리어 경로</Text>
          {report.path.map((step, i) => (
            <View key={i} style={S.pathItem}>
              <View style={S.pathNum}>
                <Text style={S.pathNumText}>{i + 1}</Text>
              </View>
              <View style={S.pathBody}>
                <Text style={S.pathTitle}>{step}</Text>
                {report.pathDetails?.[i] && (
                  <Text style={S.pathDetail}>{report.pathDetails[i]}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Daily Life + Prospects */}
        {(report.dailyLife || report.prospects) && (
          <>
            <View style={S.divider} />
            <View style={S.twoCol}>
              {report.dailyLife && (
                <View style={S.col}>
                  <Text style={S.sectionLabel}>DAILY LIFE · 하루 일상</Text>
                  <Text style={S.paraText}>{report.dailyLife}</Text>
                </View>
              )}
              {report.prospects && (
                <View style={S.col}>
                  <Text style={S.sectionLabel}>PROSPECTS · 미래 전망</Text>
                  <Text style={S.paraText}>{report.prospects}</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={S.divider} />

        {/* Message */}
        <View style={S.messageBox}>
          <Text style={S.messageLabel}>ENCOURAGEMENT</Text>
          <Text style={S.messageText}>{report.message}</Text>
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Framelab Dream Report — {career} · {age}살</Text>
          <Text style={S.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadDreamPDF(props: DreamPDFProps, filename?: string): Promise<void> {
  ensureFonts();
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DreamPDFDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `dream-${props.career}-${props.age}살.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadImageFromUrl(src: string, filename: string): Promise<void> {
  if (src.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  const res = await fetch(src);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

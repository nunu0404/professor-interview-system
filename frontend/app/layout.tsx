import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    title: '연구실 면담 신청 시스템 | 학과 소개의 날',
    description: '학과 소개의 날 — 연구실 방문 세션 신청 및 배정 관리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}

'use client';
import { useEffect, useState } from 'react';

export default function ResultQRPage() {
    const [qrUrl, setQrUrl] = useState('');
    const [resultUrl, setResultUrl] = useState('');

    useEffect(() => {
        const load = async () => {
            let host = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            if (host === 'localhost' || host === '127.0.0.1') {
                try {
                    const res = await fetch('/api/network-ip');
                    const data = await res.json();
                    if (data.ip) host = data.ip;
                } catch { }
            }
            const isLocal = host === 'localhost' || host.match(/^(192|10|172|127)\./);
            const protocol = isLocal ? 'http:' : window.location.protocol;
            const hostUrl = `${protocol}//${host}${port}`;
            setResultUrl(`${hostUrl}/result`);
            setQrUrl(`/api/qr?target=${encodeURIComponent(`${hostUrl}/result`)}`);
        };
        load();
    }, []);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: 32, textAlign: 'center',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,160,0.08) 0%, var(--bg) 70%)',
        }}>
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
                    🗓️ 배정 결과 확인
                </div>
                <p style={{ fontSize: '1.1rem', color: 'var(--text2)' }}>
                    QR 코드를 스캔하면 본인 세션 배정 결과를 확인할 수 있습니다
                </p>
            </div>

            {qrUrl && (
                <div style={{
                    background: '#fff', borderRadius: 24, padding: 24, marginBottom: 24,
                    boxShadow: '0 0 60px rgba(34,211,160,0.15)',
                }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrUrl} alt="결과 확인 QR 코드" style={{ width: 240, height: 240, display: 'block' }} />
                </div>
            )}

            <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '12px 24px', fontSize: '0.95rem', color: 'var(--text2)', marginBottom: 32,
                fontFamily: 'monospace',
            }}>
                {resultUrl}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <a href="/result" target="_blank" className="btn btn-primary">🔍 결과 조회 페이지 열기</a>
                <a href="/admin" className="btn btn-secondary">← 관리자 대시보드</a>
            </div>

            <div style={{
                marginTop: 32, padding: '16px 24px', background: 'var(--surface2)', borderRadius: 12,
                fontSize: '0.85rem', color: 'var(--text3)', maxWidth: 460, lineHeight: 1.6
            }}>
                💡 배정 완료 후 이 화면을 빔프로젝터로 표시하거나,<br />
                학생들에게 링크를 공유하세요.
            </div>
        </div>
    );
}

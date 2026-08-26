'use client';
import { useEffect, useState } from 'react';

export default function QRPage() {
    const [count, setCount] = useState<number | null>(null);
    const [applyUrl, setApplyUrl] = useState('');
    const [surveyUrl, setSurveyUrl] = useState('');
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        const loadHost = async () => {
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
            setApplyUrl(`${protocol}//${host}${port}/apply`);
            setSurveyUrl(`${protocol}//${host}${port}/survey`);
        };
        loadHost();

        const fetchCount = () => {
            fetch('/api/students')
                .then(r => r.json())
                .then(d => setCount(Array.isArray(d) ? d.length : 0))
                .catch(() => { });
        };
        fetchCount();
        const pollId = setInterval(fetchCount, 5000);
        setNow(new Date());
        const clockId = setInterval(() => setNow(new Date()), 1000);
        return () => { clearInterval(pollId); clearInterval(clockId); };
    }, []);

    return (
        <div className="qr-screen">
            <div className="qr-container fade-in">
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                        <span className="live-dot" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 500 }}>
                            {now ? now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '--:--:--'} 신청 현황 실시간 반영 중
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>
                        🎓 학과 소개의 날
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text2)' }}>
                        연구실 방문 세션 신청 — QR 코드를 스캔해주세요
                    </p>
                </div>

                {/* QR + Count */}
                <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="qr-box">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/api/qr"
                            alt="신청 QR 코드"
                            className="qr-image"
                            style={{ display: 'block' }}
                        />
                        <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--text3)', wordBreak: 'break-all' }}>
                            {applyUrl}
                        </p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
                        <div className="stat-card" style={{ minWidth: 200 }}>
                            <div className="stat-value stat-accent">
                                {count === null ? '...' : count}
                            </div>
                            <div className="stat-label">현재 신청자 수</div>
                        </div>
                        <div className="card" style={{ padding: '16px 20px' }}>
                            <h3 style={{ marginBottom: 8, fontSize: '0.9rem' }}>📱 신청 방법</h3>
                            <ol style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 2 }}>
                                <li>QR 코드 스캔</li>
                                <li>이름·연락처 입력</li>
                                <li>1~3지망 연구실 선택</li>
                                <li>제출 완료!</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Survey Section */}
                <div className="card" style={{ marginTop: 32, textAlign: 'center', padding: '32px 20px', border: '2px solid var(--primary)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>📝 만족도 조사</h2>
                    <p style={{ color: 'var(--text2)', marginBottom: 24 }}>행사가 끝나신 후, 아래 QR 코드를 스캔하여 만족도 조사에 참여해 주세요.</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/qr?url=${encodeURIComponent(surveyUrl)}`}
                            alt="만족도 조사 QR 코드"
                            className="qr-image"
                            style={{ display: 'block', width: 200, height: 200, borderRadius: 12, border: '4px solid var(--surface2)' }}
                        />
                        <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--text3)', wordBreak: 'break-all' }}>
                            {surveyUrl}
                        </p>
                        <a href="/survey" className="btn btn-primary" style={{ marginTop: 16 }}>
                            만족도 조사 작성하기
                        </a>
                    </div>
                </div>

                {/* Removed Admin link */}
            </div>
        </div>
    );
}

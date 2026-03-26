'use client';
import { useEffect, useState } from 'react';

const SCHEDULE = [
    { time: '13:00~13:10', place: 'E3-112', content: '학과 소개', note: '학과장님 진행' },
    { time: '13:10~14:05', place: 'E3 로비', content: '연구실별 포스터 발표 + 스탬프 챌린지', note: 'Session 2·3 선착순 신청' },
    { time: '14:05~14:15', place: 'E3-112', content: 'Break Time', note: '기념품 및 여비지원 신청서 배부' },
    { time: '14:15~15:00', place: '연구실별', content: '[Session 1] 실험실 투어 및 면담', note: '사전 배정 연구실' },
    { time: '15:00~15:45', place: '연구실별', content: '[Session 2] 실험실 투어 및 면담', note: '' },
    { time: '15:45~16:30', place: '연구실별', content: '[Session 3] 실험실 투어 및 면담', note: '' },
    { time: '16:30~16:45', place: 'E3-112', content: '폐회', note: '서류 제출, 셔틀버스 이동' },
];

export default function QRPage() {
    const [count, setCount] = useState<number | null>(null);
    const [applyUrl, setApplyUrl] = useState('');
    const [now, setNow] = useState(new Date());

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
                            {now.toLocaleTimeString('ko-KR')} 신청 현황 실시간 반영 중
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

                {/* Schedule */}
                <div className="card" style={{ marginTop: 32, textAlign: 'left' }}>
                    <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        🗓️ 오늘의 일정
                    </h3>
                    <div className="timeline">
                        {SCHEDULE.map((s, i) => (
                            <div key={i} className={`timeline-item ${i === 3 ? 'tl-now' : ''}`}>
                                <span className="timeline-time">{s.time}</span>
                                <span className="timeline-place" style={{ minWidth: 80, color: 'var(--text3)', fontSize: '0.8rem' }}>{s.place}</span>
                                <div>
                                    <div style={{ color: 'var(--text)', fontWeight: i >= 3 && i <= 5 ? 600 : 400 }}>{s.content}</div>
                                    {s.note && <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{s.note}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Removed Admin link */}
            </div>
        </div>
    );
}

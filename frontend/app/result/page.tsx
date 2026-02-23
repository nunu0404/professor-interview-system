'use client';
import { useState, useEffect } from 'react';

interface SessionResult {
    session_number: number;
    lab_name: string;
    professor_name: string;
    location: string;
}

interface StudentResult {
    name: string;
    student_id: string;
    affiliation: string;
    sessions: SessionResult[];
    choices: { choice: number; name: string; professor: string }[];
}

const SESSION_TIME = ['', '14:15~15:00', '15:00~15:45', '15:45~16:30'];
const SESSION_COLOR = ['', '#4f8ef7', '#7c5be0', '#22d3a0'];

export default function ResultPage() {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [result, setResult] = useState<StudentResult | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPublished, setIsPublished] = useState<boolean | null>(null);

    async function lookup(e: React.FormEvent) {
        e.preventDefault();
        if (!phone.trim() || !name.trim()) return;
        setLoading(true); setError(''); setResult(null); setIsPublished(null);
        try {
            const res = await fetch(`/api/result?phone=${encodeURIComponent(phone.trim())}&name=${encodeURIComponent(name.trim())}`);
            const data = await res.json();

            if (data.published === false) {
                setIsPublished(false);
                return;
            }

            if (!res.ok) { setError(data.error || '조회 실패'); return; }
            setIsPublished(true);
            setResult(data);
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.08) 0%, var(--bg) 70%)'
        }}>

            <div style={{ width: '100%', maxWidth: 520 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>세션 배정 확인</h1>
                    <p style={{ color: 'var(--text2)' }}>연락처를 입력하면 본인 세션 일정을 확인할 수 있습니다.</p>
                </div>

                {/* Search form */}
                <div className="card fade-in" style={{ marginBottom: 24 }}>
                    <form onSubmit={lookup}>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label>연락처</label>
                            <input
                                id="phone_input"
                                type="tel"
                                placeholder="예: 010-1234-5678"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                style={{ fontSize: '1.1rem' }}
                                autoFocus
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label>이름</label>
                            <input
                                id="name_input"
                                type="text"
                                placeholder="예: 홍길동"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                style={{ fontSize: '1.1rem' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" id="lookup-btn"
                            style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? <><span className="spin">⟳</span> 조회 중...</> : '🔍 배정 결과 조회'}
                        </button>
                    </form>
                </div>

                {error && <div className="alert alert-error fade-in">{error}</div>}

                {/* Not Published Message */}
                {isPublished === false && (
                    <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: 12 }}>현재 최적의 배정을 진행 중입니다</h2>
                        <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                            모든 학생 분들이 최대한 희망하는 연구실에 배정될 수 있도록<br />
                            관리자가 수동 조율 중입니다.
                        </p>
                        <div className="alert alert-info" style={{ marginTop: 24, display: 'inline-block', textAlign: 'left' }}>
                            💡 잠시 후 빔프로젝터 안내에 따라 다시 조회해 주세요.
                        </div>
                    </div>
                )}

                {/* Result */}
                {isPublished && result && (
                    <div className="fade-in">
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-grad)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                }}>
                                    👤
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{result.name}</div>
                                    <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
                                        {/* Phone is kept private, only showing affiliation if exists or a generic subtext */}
                                        {result.affiliation || '지원자'}
                                    </div>
                                </div>
                            </div>

                            {/* Sessions */}
                            {result.sessions.length === 0 ? (
                                <div className="alert alert-info">
                                    아직 배정 결과가 확정되지 않았습니다. 잠시 후 다시 확인해 주세요.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {[1, 2, 3].map(num => {
                                        const session = result.sessions.find(s => s.session_number === num);
                                        return (
                                            <div key={num} style={{
                                                border: `2px solid ${session ? SESSION_COLOR[num] : 'var(--border)'}`,
                                                borderRadius: 12, padding: '16px 20px',
                                                background: session ? `${SESSION_COLOR[num]}15` : 'var(--surface2)',
                                                opacity: session ? 1 : 0.6,
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            <span className={`badge badge-session${num}`} style={{ fontSize: '0.8rem' }}>
                                                                Session {num}
                                                            </span>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{SESSION_TIME[num]}</span>
                                                        </div>
                                                        {session ? (
                                                            <>
                                                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{session.lab_name}</div>
                                                                <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>👨‍🏫 {session.professor_name}</div>
                                                                {session.location && (
                                                                    <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>📍 {session.location}</div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div style={{ color: 'var(--text3)' }}>미배정</div>
                                                        )}
                                                    </div>
                                                    {session && (
                                                        <div style={{ fontSize: '1.6rem' }}>
                                                            {num === 1 ? '🔬' : num === 2 ? '🏛️' : '⚗️'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Originally chosen preferences */}
                        {result.choices.length > 0 && (
                            <div className="card" style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginBottom: 10, fontWeight: 500 }}>
                                    📋 신청 시 선택한 연구실
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {result.choices.map(c => (
                                        <span key={c.choice} className={`badge badge-${c.choice}`}>
                                            {c.choice}지망: {c.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="alert alert-info" style={{ marginTop: 16, fontSize: '0.85rem' }}>
                            📌 배정된 연구실 포스터 앞에서 대기 후, 대표 학생의 안내에 따라 이동해 주세요.
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <a href="/" style={{ color: 'var(--text3)', fontSize: '0.85rem', textDecoration: 'none' }}>← 처음으로</a>
                </div>
            </div>
        </div>
    );
}

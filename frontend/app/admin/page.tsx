'use client';
import { useEffect, useState, useCallback } from 'react';

interface Stats {
    total: number;
    labCounts: { id: number; name: string; professor_name: string; c1: number; c2: number; c3: number }[];
    sessionCounts: { s1: number; s2: number; s3: number };
    recent: { id: number; name: string; phone: string; email: string; created_at: string }[];
    anomalies: { unassigned: number; outOfChoice: number };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [toggling, setToggling] = useState(false);

    const load = useCallback(async () => {
        try {
            const [stuRes, assRes, labRes, settingsRes] = await Promise.all([
                fetch('/api/students').then(r => r.json()),
                fetch('/api/assignments').then(r => r.json()),
                fetch('/api/labs').then(r => r.json()),
                fetch('/api/settings').then(r => r.json()),
            ]);

            const students = Array.isArray(stuRes) ? stuRes : [];
            const assignments = Array.isArray(assRes) ? assRes : [];
            const labs = Array.isArray(labRes) ? labRes : [];

            setRegistrationOpen(settingsRes?.registration_open ?? true);

            const labMap: Record<number, { name: string; professor_name: string; c1: number; c2: number; c3: number }> = {};
            labs.forEach((l: { id: number; name: string; professor_name: string }) => {
                labMap[l.id] = { name: l.name, professor_name: l.professor_name, c1: 0, c2: 0, c3: 0 };
            });
            students.forEach((s: { choice1_lab_id: number; choice2_lab_id: number; choice3_lab_id: number }) => {
                if (s.choice1_lab_id && labMap[s.choice1_lab_id]) labMap[s.choice1_lab_id].c1++;
                if (s.choice2_lab_id && labMap[s.choice2_lab_id]) labMap[s.choice2_lab_id].c2++;
                if (s.choice3_lab_id && labMap[s.choice3_lab_id]) labMap[s.choice3_lab_id].c3++;
            });

            const s1 = assignments.filter((a: { session_number: number }) => a.session_number === 1).length;
            const s2 = assignments.filter((a: { session_number: number }) => a.session_number === 2).length;
            const s3 = assignments.filter((a: { session_number: number }) => a.session_number === 3).length;

            let unassigned = 0;
            let outOfChoice = 0;

            students.forEach((s: { id: number; choice1_lab_id: number; choice2_lab_id: number; choice3_lab_id: number }) => {
                const stuAssignments = assignments.filter((a: { student_id: number; lab_id: number }) => a.student_id === s.id);
                if (stuAssignments.length < 3) {
                    unassigned++;
                }
                stuAssignments.forEach((a: { lab_id: number }) => {
                    if (a.lab_id !== s.choice1_lab_id && a.lab_id !== s.choice2_lab_id && a.lab_id !== s.choice3_lab_id) {
                        outOfChoice++;
                    }
                });
            });

            setStats({
                total: students.length,
                labCounts: Object.entries(labMap).map(([id, v]) => ({ id: Number(id), ...v })),
                sessionCounts: { s1, s2, s3 },
                recent: students.slice(0, 8),
                anomalies: { unassigned, outOfChoice },
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, [load]);

    async function toggleRegistration() {
        setToggling(true);
        try {
            const next = !registrationOpen;
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registration_open: next }),
            });
            setRegistrationOpen(next);
        } finally {
            setToggling(false);
        }
    }

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>불러오는 중...</div>;
    if (!stats) return null;

    return (
        <div className="fade-in">
            {/* Registration Status Banner */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderRadius: 12, marginBottom: 20,
                background: registrationOpen ? 'rgba(34,211,160,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${registrationOpen ? 'rgba(34,211,160,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {registrationOpen ? <span className="live-dot" /> : <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%' }} />}
                    <span style={{ fontWeight: 600, color: registrationOpen ? 'var(--success)' : 'var(--danger)' }}>
                        신청 {registrationOpen ? '진행 중' : '마감됨'}
                    </span>
                    <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
                        {registrationOpen ? '학생들이 지금 신청할 수 있습니다' : '신청 폼이 비활성화됩니다'}
                    </span>
                </div>
                <button
                    className={`btn btn-sm ${registrationOpen ? 'btn-danger' : 'btn-success'}`}
                    onClick={toggleRegistration} disabled={toggling}
                >
                    {toggling ? <span className="spin">⟳</span> : registrationOpen ? '🔒 신청 마감' : '🔓 신청 오픈'}
                </button>
            </div>

            {/* Anomaly Detection Banners */}
            {stats.anomalies.unassigned > 0 && (
                <div className="alert alert-error" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>🚨</span>
                    <div>
                        <strong>불완전 배정 경고:</strong> {stats.anomalies.unassigned}명의 학생이 3개의 세션을 온전히 배정받지 못했습니다. <a href="/admin/assignments" style={{ color: 'inherit', textDecoration: 'underline' }}>수동 배정</a>으로 채워주세요.
                    </div>
                </div>
            )}
            {stats.anomalies.outOfChoice > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                        <strong>지망 외 배정 발생:</strong> {stats.anomalies.outOfChoice}건의 배정이 학생의 1~3지망 외의 연구실로 이루어졌습니다.
                    </div>
                </div>
            )}


            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h1 style={{ marginBottom: 4 }}>📊 관리자 대시보드</h1>
                    <p>실시간 신청 현황 및 배정 요약</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={load}>🔄 새로고침</button>
                    <a href="/apply" target="_blank" className="btn btn-secondary btn-sm">↗ 신청 폼</a>
                    <a href="/result" target="_blank" className="btn btn-secondary btn-sm">🔍 결과 조회</a>
                    <a href="/admin/result-qr" target="_blank" className="btn btn-secondary btn-sm">📱 결과 QR 송출</a>
                    <a href="/admin/print" className="btn btn-primary btn-sm">🖨️ 배정 명단</a>
                    <a href="/api/export/students" download className="btn btn-secondary btn-sm">⬇️ 학생 CSV</a>
                    <a href="/api/export/assignments" download className="btn btn-secondary btn-sm">⬇️ 배정 CSV</a>
                </div>
            </div>

            {/* Key Stats */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-value stat-accent">{stats.total}</div>
                    <div className="stat-label">총 신청자</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value stat-success">{stats.sessionCounts.s1}</div>
                    <div className="stat-label">Session 1 배정 완료</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: '#a78bfa' }}>{stats.sessionCounts.s2}</div>
                    <div className="stat-label">Session 2 배정 완료</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value stat-warning">{stats.sessionCounts.s3}</div>
                    <div className="stat-label">Session 3 배정 완료</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Lab demand */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>🔬 연구실별 지망 현황</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stats.labCounts
                            .sort((a, b) => (b.c1 + b.c2 + b.c3) - (a.c1 + a.c2 + a.c3))
                            .map(lab => (
                                <div key={lab.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lab.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{lab.professor_name}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <span className="badge badge-1">1지망 {lab.c1}</span>
                                        <span className="badge badge-2">2지망 {lab.c2}</span>
                                        <span className="badge badge-3">3지망 {lab.c3}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Recent applicants */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>🕐 최근 신청자</h2>
                    {stats.recent.length === 0 ? (
                        <div style={{ color: 'var(--text3)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>
                            아직 신청자가 없습니다
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {stats.recent.map((s) => (
                                <div key={s.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 600, marginRight: 8 }}>{s.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{s.phone}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                                        {new Date(s.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        <a href="/admin/students" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                            전체 목록 보기
                        </a>
                        <a href="/admin/assignments" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                            세션 배정 관리
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

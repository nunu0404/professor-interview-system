'use client';
import { useState, useEffect, useCallback } from 'react';

interface Settings {
    registration_open: boolean;
    registration_close_at: string | null;
    results_published: boolean;
}

type ResetTarget = 'assignments' | 'students' | 'all';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [closeAt, setCloseAt] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [resetConfirm, setResetConfirm] = useState<ResetTarget | null>(null);
    const [resetting, setResetting] = useState(false);
    const [studentCount, setStudentCount] = useState(0);
    const [assignCount, setAssignCount] = useState(0);
    const [publishing, setPublishing] = useState(false);

    const load = useCallback(async () => {
        const [s, st, as] = await Promise.all([
            fetch('/api/settings').then(r => r.json()),
            fetch('/api/students').then(r => r.json()),
            fetch('/api/assignments').then(r => r.json()),
        ]);
        setSettings(s);
        setCloseAt(s.registration_close_at
            ? new Date(s.registration_close_at).toISOString().slice(0, 16)
            : '');
        setStudentCount(Array.isArray(st) ? st.length : 0);
        setAssignCount(Array.isArray(as) ? as.length : 0);
    }, []);

    useEffect(() => { load(); }, [load]);

    async function saveTimer() {
        setSaving(true); setMsg('');
        try {
            const closeAtISO = closeAt ? new Date(closeAt).toISOString() : '';
            await fetch('/api/settings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registration_close_at: closeAtISO }),
            });
            setMsg('✅ 저장되었습니다.');
            await load();
        } finally { setSaving(false); }
    }

    async function clearTimer() {
        setSaving(true); setMsg('');
        try {
            await fetch('/api/settings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registration_close_at: '' }),
            });
            setCloseAt('');
            setMsg('✅ 타이머가 해제되었습니다.');
            await load();
        } finally { setSaving(false); }
    }

    async function togglePublish() {
        if (!settings) return;
        setPublishing(true); setMsg('');
        try {
            const next = !settings.results_published;
            await fetch('/api/settings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results_published: next }),
            });
            setMsg(next ? '✅ 배정 결과가 학생들에게 공개되었습니다.' : '✅ 배정 결과가 비공개로 전환되었습니다.');
            await load();
        } finally { setPublishing(false); }
    }

    async function doReset(target: ResetTarget) {
        setResetting(true); setMsg('');
        try {
            await fetch(`/api/reset?target=${target}`, { method: 'DELETE' });
            const labels: Record<ResetTarget, string> = {
                assignments: '배정 데이터',
                students: '학생 + 배정 데이터',
                all: '전체 데이터',
            };
            setMsg(`✅ ${labels[target]}가 초기화되었습니다.`);
            await load();
        } finally {
            setResetting(false);
            setResetConfirm(null);
        }
    }

    if (!settings) return <div style={{ padding: 48, textAlign: 'center' }}>불러오는 중...</div>;

    const closeAtDate = settings.registration_close_at ? new Date(settings.registration_close_at) : null;
    const isExpired = closeAtDate && closeAtDate <= new Date();

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ marginBottom: 4 }}>⚙️ 시스템 설정</h1>
                <p>신청 마감 타이머, 데이터 초기화, 접근 관리</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                {/* ── Auto-close Timer ── */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', marginBottom: 4 }}>⏱️ 신청 자동 마감 타이머</h2>
                    <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>
                        지정된 시각이 되면 자동으로 신청을 마감합니다.
                    </p>

                    <div style={{
                        marginBottom: 16, padding: '12px 16px', borderRadius: 8,
                        background: settings.registration_open ? 'rgba(34,211,160,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${settings.registration_open ? 'rgba(34,211,160,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                        <span style={{ fontWeight: 600, color: settings.registration_open ? 'var(--success)' : 'var(--danger)' }}>
                            {settings.registration_open ? '🟢 신청 진행 중' : '🔴 신청 마감됨'}
                        </span>
                        {closeAtDate && !isExpired && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: 4 }}>
                                마감 예정: {closeAtDate.toLocaleString('ko-KR')}
                            </div>
                        )}
                        {closeAtDate && isExpired && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: 4 }}>
                                {closeAtDate.toLocaleString('ko-KR')}에 자동 마감됨
                            </div>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>자동 마감 시각</label>
                        <input type="datetime-local" value={closeAt}
                            onChange={e => setCloseAt(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={saveTimer} disabled={saving || !closeAt}>
                            {saving ? <span className="spin">⟳</span> : '⏱️ 타이머 설정'}
                        </button>
                        {settings.registration_close_at && (
                            <button className="btn btn-danger btn-sm" onClick={clearTimer} disabled={saving}>
                                타이머 해제
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Results Publish Toggle ── */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', marginBottom: 4 }}>📢 배정 결과 공개</h2>
                    <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>
                        결과를 비공개하면 학생들이 결과를 볼 수 없습니다.<br />
                        수동 조율이 모두 끝난 후 공개로 전환하세요.
                    </p>

                    <div style={{
                        marginBottom: 16, padding: '12px 16px', borderRadius: 8,
                        background: settings.results_published ? 'rgba(34,211,160,0.08)' : 'var(--surface2)',
                        border: `1px solid ${settings.results_published ? 'rgba(34,211,160,0.3)' : 'var(--border)'}`,
                    }}>
                        <span style={{ fontWeight: 600, color: settings.results_published ? 'var(--success)' : 'var(--text3)' }}>
                            {settings.results_published ? '🟢 결과 공개 중' : '🔒 결과 비공개'}
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: 4 }}>
                            {settings.results_published
                                ? '현재 학생들이 /result 페이지에서 본인 배정을 확인할 수 있습니다.'
                                : '학생들이 /result 페이지에 접속하면 "현재 배정을 조율 중입니다" 문구가 나타납니다.'}
                        </div>
                    </div>

                    <button
                        className={`btn ${settings.results_published ? 'btn-danger' : 'btn-success'}`}
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={togglePublish} disabled={publishing}>
                        {publishing ? <span className="spin">⟳</span> : settings.results_published ? '비공개로 전환' : '결과 공개하기'}
                    </button>
                </div>

                {/* ── Password info ── */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', marginBottom: 4 }}>🔐 관리자 비밀번호</h2>
                    <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>
                        비밀번호 변경은 서버 환경변수 <code>ADMIN_PASSWORD</code>를 수정하세요.
                    </p>
                    <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--surface2)', fontSize: '0.85rem' }}>
                        <div style={{ marginBottom: 8 }}>현재 비밀번호: <code style={{ color: 'var(--accent)' }}>
                            {process.env.NEXT_PUBLIC_ADMIN_PW_HINT || 'openlab2026 (기본값)'}
                        </code></div>
                        <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>
                            .env.local에 <code>ADMIN_PASSWORD=yourpassword</code>를 추가하세요.
                        </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <a href="/admin/result-qr" className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>
                            📱 결과 확인 QR 페이지
                        </a>
                    </div>
                </div>

                {/* ── Data Reset ── */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h2 style={{ fontSize: '1rem', marginBottom: 4 }}>🗑️ 데이터 초기화</h2>
                    <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>
                        실제 행사 전 테스트 데이터를 삭제할 때 사용하세요. <strong style={{ color: 'var(--danger)' }}>되돌릴 수 없습니다.</strong>
                    </p>

                    <div style={{
                        display: 'flex', gap: 12, marginBottom: 16,
                        padding: '16px', background: 'var(--surface2)', borderRadius: 10
                    }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{studentCount}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>학생 신청</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a78bfa' }}>{assignCount}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>세션 배정</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {([
                            { target: 'assignments' as ResetTarget, label: '배정만 초기화', icon: '🗓️', desc: `배정 ${assignCount}건 삭제` },
                            { target: 'students' as ResetTarget, label: '학생+배정 초기화', icon: '👥', desc: `학생 ${studentCount}명 + 배정 전체 삭제` },
                            { target: 'all' as ResetTarget, label: '전체 초기화', icon: '💥', desc: '모든 데이터 삭제 (연구실 제외)' },
                        ]).map(item => (
                            <div key={item.target} style={{ flex: '1 1 200px' }}>
                                {resetConfirm === item.target ? (
                                    <div style={{ border: '2px solid var(--danger)', borderRadius: 10, padding: '12px 14px' }}>
                                        <div style={{ fontSize: '0.85rem', marginBottom: 10, color: 'var(--danger)', fontWeight: 600 }}>
                                            ⚠️ {item.desc} — 정말 삭제하시겠습니까?
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                                                onClick={() => doReset(item.target)} disabled={resetting}>
                                                {resetting ? <span className="spin">⟳</span> : '삭제'}
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setResetConfirm(null)}>취소</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 14px' }}
                                        onClick={() => setResetConfirm(item.target)}>
                                        <span style={{ marginRight: 8 }}>{item.icon}</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{item.desc}</div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {msg && <div className="alert alert-info" style={{ marginTop: 12 }}>{msg}</div>}
                </div>
            </div>
        </div>
    );
}

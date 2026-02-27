'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Lab {
    id: number;
    name: string;
    professor_name: string;
    description: string;
    location: string;
}

const CHOICE_LABELS = ['', '1지망', '2지망', '3지망'];
const CHOICE_CLASSES = ['', 'sel-1', 'sel-2', 'sel-3'];
const BADGE_CLASSES = ['', 'lab-badge-1', 'lab-badge-2', 'lab-badge-3'];

export default function ApplyPage() {
    const router = useRouter();
    const [labs, setLabs] = useState<Lab[]>([]);
    const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
    const [closeAt, setCloseAt] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState('');
    const [form, setForm] = useState({
        name: '', phone: '', email: '', affiliation: '',
    });
    const [choices, setChoices] = useState<number[]>([0, 0, 0]); // index 0=1st, 1=2nd, 2=3rd
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/labs').then(r => r.json()).then(setLabs);
        fetch('/api/settings').then(r => r.json()).then(d => {
            setRegistrationOpen(d?.registration_open ?? true);
            if (d?.registration_close_at) setCloseAt(new Date(d.registration_close_at));
        });
    }, []);

    // Countdown ticker
    useEffect(() => {
        if (!closeAt) return;
        const tick = () => {
            const diff = closeAt.getTime() - Date.now();
            if (diff <= 0) { setRegistrationOpen(false); setCountdown(''); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${h > 0 ? `${h}시간 ` : ''}${m}분 ${s}초`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [closeAt]);

    function getLabChoice(labId: number): number {
        // Returns 1, 2, or 3 if selected, else 0
        const idx = choices.indexOf(labId);
        return idx === -1 ? 0 : idx + 1;
    }

    function handleLabClick(labId: number) {
        const choiceNum = getLabChoice(labId);
        if (choiceNum > 0) {
            // Deselect
            const next = [...choices];
            next[choiceNum - 1] = 0;
            setChoices(next);
        } else {
            // Assign to first empty slot
            const slot = choices.indexOf(0);
            if (slot === -1) return; // all 3 chosen already
            const next = [...choices];
            next[slot] = labId;
            setChoices(next);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!form.name || !form.phone || !form.email || !form.affiliation) { setError('이름, 연락처, 이메일, 소속학교를 모두 입력해주세요.'); return; }
        if (!choices[0]) { setError('최소 1지망 연구실을 선택해주세요.'); return; }
        setSubmitting(true);
        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    choice1_lab_id: choices[0] || null,
                    choice2_lab_id: choices[1] || null,
                    choice3_lab_id: choices[2] || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || '제출 실패. 다시 시도해주세요.'); return; }
            router.push('/apply/complete');
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    }

    // Registration closed screen
    if (registrationOpen === false) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div className="card fade-in" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>신청이 마감되었습니다</h1>
                    <p style={{ marginBottom: 28 }}>현재 연구실 방문 신청 기간이 아닙니다.<br />배정 결과는 아래 링크에서 확인해 주세요.</p>
                    <a href="/result" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        🔍 배정 결과 확인하기
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="page-sm" style={{ paddingTop: 48 }}>
            {/* Countdown banner */}
            {countdown && (
                <div style={{
                    marginBottom: 20, padding: '10px 16px', borderRadius: 10,
                    background: 'rgba(247,180,56,0.1)', border: '1px solid rgba(247,180,56,0.3)',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem'
                }}>
                    ⏱️ <span>신청 마감까지 <strong style={{ color: 'var(--warning)' }}>{countdown}</strong> 남았습니다</span>
                </div>
            )}
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>연구실 방문 신청</h1>
                <p style={{ color: 'var(--text2)' }}>1지망~3지망 연구실을 선택해주세요</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Step 1: Personal Info */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: '1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: 'var(--accent-grad)', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>1</span>
                        기본 정보 입력
                    </h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>이름 *</label>
                            <input id="name" type="text" placeholder="홍길동" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>연락처 *</label>
                            <input id="phone" type="tel" placeholder="010-1234-5678" value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                            <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4 }}>본인 확인을 위해 정확히 입력해 주세요.</div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>이메일 *</label>
                            <input id="email" type="email" placeholder="example@email.com" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>소속학교 *</label>
                            <input id="affiliation" type="text" placeholder="현재 소속 또는 학교" value={form.affiliation}
                                onChange={e => setForm(p => ({ ...p, affiliation: e.target.value }))} required />
                        </div>
                    </div>
                </div>

                {/* Step 2: Lab choices */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ background: 'var(--accent-grad)', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>2</span>
                            연구실 선택 (순서대로 클릭)
                        </h2>
                        <p style={{ fontSize: '0.85rem', marginLeft: 32 }}>클릭 순서가 1지망 → 2지망 → 3지망으로 자동 지정됩니다</p>
                    </div>

                    {/* Choice summary */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} className="choice-pill" style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}
                                onClick={() => choices[i] && handleLabClick(choices[i])}>
                                <span style={{ opacity: 0.6 }}>{i + 1}지망</span>
                                <span style={{ fontWeight: 600, color: choices[i] ? undefined : 'var(--text3)' }}>
                                    {choices[i] ? labs.find(l => l.id === choices[i])?.name || '...' : '미선택'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="lab-grid">
                        {labs.map(lab => {
                            const ch = getLabChoice(lab.id);
                            return (
                                <div key={lab.id} className={`lab-card ${CHOICE_CLASSES[ch]}`} onClick={() => handleLabClick(lab.id)}>
                                    {ch > 0 && <div className={`lab-badge ${BADGE_CLASSES[ch]}`}>{ch}</div>}
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{lab.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 8 }}>👨‍🏫 {lab.professor_name}</div>
                                    {lab.location && <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8 }}>📍 {lab.location}</div>}
                                    {lab.description && <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>{lab.description}</div>}
                                    {ch === 0 && choices.indexOf(0) === -1 && (
                                        <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text3)' }}>이미 3개 선택 완료</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <button type="submit" className="btn btn-primary btn-lg" id="submit-btn"
                    disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? <><span className="spin">⟳</span> 제출 중...</> : '✅ 신청 제출하기'}
                </button>
            </form>

            <div style={{ height: 48 }} />
        </div>
    );
}

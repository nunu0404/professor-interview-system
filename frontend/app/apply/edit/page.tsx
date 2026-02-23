'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Lab { id: number; name: string; professor_name: string; description: string; location: string; }
interface ExistingApp {
    id: number; name: string; affiliation: string; phone: string; email: string;
    choice1_lab_id: number; choice2_lab_id: number; choice3_lab_id: number;
    c1_name: string; c2_name: string; c3_name: string;
}

const CHOICE_CLASSES = ['', 'sel-1', 'sel-2', 'sel-3'];
const BADGE_CLASSES = ['', 'lab-badge-1', 'lab-badge-2', 'lab-badge-3'];

export default function EditApplyPage() {
    const router = useRouter();
    const [step, setStep] = useState<'lookup' | 'edit' | 'done'>('lookup');
    const [phoneInput, setPhoneInput] = useState(''); // we will use this for phone input
    const [nameInput, setNameInput] = useState('');
    const [existing, setExisting] = useState<ExistingApp | null>(null);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [choices, setChoices] = useState<number[]>([0, 0, 0]);
    const [lookupError, setLookupError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationOpen, setRegistrationOpen] = useState(true);

    useEffect(() => {
        fetch('/api/labs').then(r => r.json()).then(setLabs);
        fetch('/api/settings').then(r => r.json()).then(d => setRegistrationOpen(d?.registration_open ?? true));
    }, []);

    async function lookup(e: React.FormEvent) {
        e.preventDefault();
        setLookupError(''); setLoading(true);
        try {
            const res = await fetch(`/api/students/edit?phone=${encodeURIComponent(phoneInput)}&name=${encodeURIComponent(nameInput)}`);
            const data = await res.json();
            if (!res.ok) { setLookupError(data.error); return; }
            setExisting(data);
            setChoices([data.choice1_lab_id || 0, data.choice2_lab_id || 0, data.choice3_lab_id || 0]);
            setStep('edit');
        } catch { setLookupError('오류가 발생했습니다.'); }
        finally { setLoading(false); }
    }

    function getLabChoice(labId: number): number {
        const idx = choices.indexOf(labId);
        return idx === -1 ? 0 : idx + 1;
    }

    function handleLabClick(labId: number) {
        const choiceNum = getLabChoice(labId);
        if (choiceNum > 0) {
            const next = [...choices]; next[choiceNum - 1] = 0; setChoices(next);
        } else {
            const slot = choices.indexOf(0);
            if (slot === -1) return;
            const next = [...choices]; next[slot] = labId; setChoices(next);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(''); setLoading(true);
        try {
            const res = await fetch('/api/students/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: existing!.id,
                    choice1_lab_id: choices[0] || null,
                    choice2_lab_id: choices[1] || null,
                    choice3_lab_id: choices[2] || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setSubmitError(data.error); return; }
            setStep('done');
        } catch { setSubmitError('오류가 발생했습니다.'); }
        finally { setLoading(false); }
    }

    if (!registrationOpen) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div className="card fade-in" style={{ maxWidth: 400, textAlign: 'center', padding: '40px 32px' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                    <h1 style={{ fontSize: '1.4rem', marginBottom: 12 }}>신청 기간이 아닙니다</h1>
                    <p style={{ marginBottom: 24 }}>신청 수정은 신청 기간 중에만 가능합니다.</p>
                    <a href="/result" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>🔍 배정 결과 확인</a>
                </div>
            </div>
        );
    }

    if (step === 'done') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div className="card fade-in" style={{ maxWidth: 400, textAlign: 'center', padding: '40px 32px' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>수정 완료!</h1>
                    <p style={{ marginBottom: 24 }}>희망 연구실 정보가 업데이트되었습니다.</p>
                    <a href="/apply/complete" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>확인</a>
                </div>
            </div>
        );
    }

    return (
        <div className="page-sm" style={{ paddingTop: 48 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✏️</div>
                <h1 style={{ fontSize: '1.6rem', marginBottom: 8 }}>신청 수정</h1>
                <p style={{ color: 'var(--text2)' }}>기존 신청 내용을 변경할 수 있습니다</p>
            </div>

            {/* Step 1: Lookup */}
            {step === 'lookup' && (
                <div className="card fade-in">
                    <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>이름과 연락처로 신청 내역 조회</h2>
                    <form onSubmit={lookup}>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label>이름</label>
                            <input type="text" placeholder="홍길동" value={nameInput}
                                onChange={e => setNameInput(e.target.value)} autoFocus required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label>연락처</label>
                            <input type="text" placeholder="010-1234-5678" value={phoneInput}
                                onChange={e => setPhoneInput(e.target.value)} required />
                        </div>
                        {lookupError && <div className="alert alert-error">{lookupError}</div>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? <><span className="spin">⟳</span> 조회 중...</> : '조회'}
                        </button>
                    </form>
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', fontSize: '0.85rem', color: 'var(--text3)', textAlign: 'left' }}>
                            <li>입력하신 이름과 연락처가 신청 시와 완벽히 일치해야 합니다.</li>
                        </ul>
                        <a href="/apply" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>← 신청 폼으로 돌아가기</a>
                    </div>
                </div>
            )}

            {/* Step 2: Edit */}
            {step === 'edit' && existing && (
                <form onSubmit={handleSubmit} className="fade-in">
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-grad)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>👤</div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{existing.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{existing.phone}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 16 }}>
                            <h2 style={{ fontSize: '1rem', marginBottom: 6 }}>연구실 재선택</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>클릭 순서가 1지망 → 2지망 → 3지망으로 자동 지정됩니다</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} className="choice-pill" style={{ flex: 1, minWidth: 100, justifyContent: 'center' }}
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
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>👨‍🏫 {lab.professor_name}</div>
                                        {lab.location && <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>📍 {lab.location}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {submitError && <div className="alert alert-error">{submitError}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setStep('lookup')}>← 뒤로</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                            {loading ? <><span className="spin">⟳</span> 저장 중...</> : '✅ 수정 완료'}
                        </button>
                    </div>
                    <div style={{ height: 48 }} />
                </form>
            )}
        </div>
    );
}

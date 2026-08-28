'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SurveyPage() {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [q2Other, setQ2Other] = useState(false);
    const [q3Other, setQ3Other] = useState(false);
    const [q4Other, setQ4Other] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());

        const q2Values = fd.getAll('q2') as string[];
        if (q2Values.includes('기타')) {
            const other = fd.get('q2_other');
            if (other) q2Values[q2Values.indexOf('기타')] = `기타(${other})`;
        }
        data.q2 = q2Values.join(', ');

        const q3Values = fd.getAll('q3') as string[];
        if (q3Values.includes('기타')) {
            const other = fd.get('q3_other');
            if (other) q3Values[q3Values.indexOf('기타')] = `기타(${other})`;
        }
        data.q3 = q3Values.join(', ');

        const q4Values = fd.getAll('q4') as string[];
        if (q4Values.includes('기타')) {
            const other = fd.get('q4_other');
            if (other) q4Values[q4Values.indexOf('기타')] = `기타(${other})`;
        }
        data.q4 = q4Values.join(', ');

        if (q2Values.length === 0 || q3Values.length === 0 || q4Values.length === 0) {
            alert('2, 3, 4번 문항은 최소 하나 이상 선택해야 합니다.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setDone(true);
            } else {
                const err = await res.json();
                alert(err.error || '오류가 발생했습니다.');
            }
        } catch (error) {
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 20px', maxWidth: 400, margin: '0 auto' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>설문 제출 완료</h1>
                    <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
                        소중한 의견을 남겨주셔서 감사합니다.<br />
                        앞으로 더 나은 오픈랩 행사를 위해 노력하겠습니다.
                    </p>
                    <Link href="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
                        메인 화면으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card fade-in" style={{ maxWidth: 600, margin: '40px auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
                        📝 오픈랩 행사 만족도 조사
                    </h1>
                    <p style={{ color: 'var(--text2)' }}>
                        행사에 참여해 주셔서 감사합니다. 여러분의 소중한 의견을 기다립니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>


                    <div className="form-group">
                        <label className="form-label">2. DGIST 오픈랩 행사를 알게 된 경로 (복수 선택 가능) <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['대학원 입학 정보 커뮤니티(네이버 카페 등)', 'DGIST SNS(인스타그램, 페이스북 등)', '온라인 검색(구글, 네이버 등)', '교수 혹은 지인 소개', '포스터 혹은 홍보물'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" name="q2" value={opt} />
                                    <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                </label>
                            ))}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" name="q2" value="기타" onChange={e => setQ2Other(e.target.checked)} />
                                <span style={{ fontSize: '0.9rem' }}>기타</span>
                                {q2Other && (
                                    <input type="text" name="q2_other" className="form-input" style={{ padding: '4px 8px', fontSize: '0.85rem', width: '200px' }} placeholder="직접 입력" required />
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">3. 오픈랩 행사에 참석하게 된 이유 (복수 선택 가능) <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['학과별 연구실 분위기 및 현재 진행 중인 연구에 대해 알기 위하여', '면접 및 입학전형에 대한 자세한 정보를 얻기 위하여', 'DGIST에 개인적으로 방문하기에는 어려움이 있어서'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" name="q3" value={opt} />
                                    <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                </label>
                            ))}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" name="q3" value="기타" onChange={e => setQ3Other(e.target.checked)} />
                                <span style={{ fontSize: '0.9rem' }}>기타</span>
                                {q3Other && (
                                    <input type="text" name="q3_other" className="form-input" style={{ padding: '4px 8px', fontSize: '0.85rem', width: '200px' }} placeholder="직접 입력" required />
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">4. DGIST 대학원 과정에 관심을 갖게 된 이유 (복수 선택 가능) <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['우수한 교수진', '수준 높은 연구과제 참여', '등록금 면제 및 학생장려금', '훌륭한 시설 및 장비', '자대라서'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" name="q4" value={opt} />
                                    <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                </label>
                            ))}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" name="q4" value="기타" onChange={e => setQ4Other(e.target.checked)} />
                                <span style={{ fontSize: '0.9rem' }}>기타</span>
                                {q4Other && (
                                    <input type="text" name="q4_other" className="form-input" style={{ padding: '4px 8px', fontSize: '0.85rem', width: '200px' }} placeholder="직접 입력" required />
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">5. 오픈랩 행사 참여가 DGIST 대학원 진학 결정에 도움이 되었나요? <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {['예', '아니오', '모르겠음'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="radio" name="q5" value={opt} required />
                                    <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">6. 오픈랩 행사 개최 요일 선호도 <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {['주말(토요일)', '평일', '상관없음'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="radio" name="q6" value={opt} required />
                                    <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">7. 오픈랩 행사에 개선할 점이 있다면 아래에 자유롭게 써주세요.</label>
                        <textarea name="q7" className="form-input" rows={4} placeholder="여기에 작성해주세요..." />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: 16, padding: '14px', fontSize: '1rem' }} disabled={loading}>
                        {loading ? <span className="spin">⟳</span> : '제출하기'}
                    </button>
                </form>
            </div>
        </div>
    );
}

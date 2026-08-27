'use client';
import { useEffect, useState } from 'react';

export default function AdminSurveys() {
    const [surveys, setSurveys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/surveys')
            .then(res => res.json())
            .then(data => {
                setSurveys(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>불러오는 중...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h1 style={{ marginBottom: 4 }}>📋 만족도 조사 결과</h1>
                    <p>총 {surveys.length}건의 설문 응답</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                        if (confirm('모든 설문 결과를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                            await fetch('/api/surveys', { method: 'DELETE' });
                            window.location.reload();
                        }
                    }} className="btn btn-danger btn-sm">🗑️ 전체 초기화</button>
                    <a href="/api/export/surveys" download className="btn btn-primary btn-sm">⬇️ 설문 CSV 다운로드</a>
                </div>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                {surveys.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                        아직 제출된 설문 응답이 없습니다.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '12px 8px' }}>제출 일시</th>
                                <th style={{ padding: '12px 8px' }}>이름</th>
                                <th style={{ padding: '12px 8px' }}>소속 대학</th>
                                <th style={{ padding: '12px 8px' }}>전화번호</th>
                                <th style={{ padding: '12px 8px' }}>알게 된 경로 (Q2)</th>
                                <th style={{ padding: '12px 8px' }}>참석 이유 (Q3)</th>
                                <th style={{ padding: '12px 8px' }}>관심 이유 (Q4)</th>
                                <th style={{ padding: '12px 8px' }}>진학 도움 여부 (Q5)</th>
                                <th style={{ padding: '12px 8px' }}>개최 요일 (Q6)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surveys.map((s, idx) => (
                                <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 8px', color: 'var(--text3)' }}>
                                        {new Date(s.created_at).toLocaleString('ko-KR')}
                                    </td>
                                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ padding: '12px 8px' }}>{s.affiliation}</td>
                                    <td style={{ padding: '12px 8px' }}>{s.phone}</td>
                                    <td style={{ padding: '12px 8px' }}>{s.q2}</td>
                                    <td style={{ padding: '12px 8px' }}>{s.q3}</td>
                                    <td style={{ padding: '12px 8px' }}>{s.q4}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span className={`badge ${s.q5 === '예' ? 'badge-1' : s.q5 === '아니오' ? 'badge-3' : 'badge-2'}`}>
                                            {s.q5}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>{s.q6}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

'use client';
import { useEffect, useState, useCallback } from 'react';

interface Lab { id: number; name: string; professor_name: string; location: string; }
interface Student {
    id: number; name: string; phone: string; email: string; affiliation: string;
    choice1_name: string; choice2_name: string; choice3_name: string;
}
interface Assignment {
    student_id: number; session_number: number; lab_id: number;
    student_name: string; phone: string; email: string; affiliation: string;
    lab_name: string; professor_name: string;
    choice1_lab_id: number; choice2_lab_id: number; choice3_lab_id: number;
}

type ViewMode = 'student' | 'lab';

const SESSION_COLOR = ['', '#4f8ef7', '#7c5be0', '#22d3a0'];
const SESSION_TIME = ['', '14:15~15:00', '15:00~15:45', '15:45~16:30'];

export default function PrintPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewMode>('student');
    const [role, setRole] = useState<'admin' | 'viewer' | null>(null);

    const load = useCallback(async () => {
        const [s, l, a, authRes] = await Promise.all([
            fetch('/api/students').then(r => r.json()),
            fetch('/api/labs').then(r => r.json()),
            fetch('/api/assignments').then(r => r.json()),
            fetch('/api/auth', { method: 'GET', cache: 'no-store' }).then(r => r.json()).catch(() => ({ role: null })),
        ]);
        setStudents(Array.isArray(s) ? s : []);
        setLabs(Array.isArray(l) ? l : []);
        setAssignments(Array.isArray(a) ? a : []);
        setRole(authRes.role);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    function getAssignment(studentId: number, session: number) {
        return assignments.find(a => a.student_id === studentId && a.session_number === session);
    }

    function getLabStudents(labId: number, session: number) {
        return assignments.filter(a => a.lab_id === labId && a.session_number === session);
    }

    function choiceRank(a: Assignment, labId: number) {
        if (a.choice1_lab_id === labId) return '1지망';
        if (a.choice2_lab_id === labId) return '2지망';
        if (a.choice3_lab_id === labId) return '3지망';
        return '관리자배정';
    }

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>불러오는 중...</div>;

    return (
        <>
            {/* Print controls - hidden on print */}
            <div className="no-print" style={{
                background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 24px',
                display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100
            }}>
                {role === 'admin' && <a href="/admin" className="btn btn-secondary btn-sm">← 돌아가기</a>}
                <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    <button className={`btn btn-sm ${view === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setView('student')}>👥 학생별 배정표</button>
                    <button className={`btn btn-sm ${view === 'lab' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setView('lab')}>🔬 연구실별 배정표</button>
                </div>
                <button onClick={() => window.print()} className="btn btn-primary btn-sm">🖨️ 인쇄하기</button>
                {role === 'admin' && (
                    <>
                        <a href="/api/export/students" className="btn btn-secondary btn-sm" download>⬇️ 학생 CSV</a>
                        <a href="/api/export/assignments" className="btn btn-secondary btn-sm" download>⬇️ 배정 CSV</a>
                    </>
                )}
            </div>

            <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>
                        🎓 오픈랩 세션 배정 명단
                    </h1>
                    <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
                        2026.03.28.(토) · DGIST · 총 신청자 {students.length}명
                    </p>
                    <p style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>
                        Session 1: 14:15~15:00 · Session 2: 15:00~15:45 · Session 3: 15:45~16:30
                    </p>
                </div>

                {/* ===== STUDENT VIEW ===== */}
                {view === 'student' && (
                    <div>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--text2)' }}>학생별 세션 배정표</h2>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: 30 }}>#</th>
                                        <th>이름</th>
                                        <th>연락처</th>
                                        <th>이메일</th>
                                        <th>소속</th>
                                        <th style={{ color: SESSION_COLOR[1] }}>Session 1<br /><span style={{ fontWeight: 400, fontSize: '0.75rem' }}>{SESSION_TIME[1]}</span></th>
                                        <th style={{ color: SESSION_COLOR[2] }}>Session 2<br /><span style={{ fontWeight: 400, fontSize: '0.75rem' }}>{SESSION_TIME[2]}</span></th>
                                        <th style={{ color: SESSION_COLOR[3] }}>Session 3<br /><span style={{ fontWeight: 400, fontSize: '0.75rem' }}>{SESSION_TIME[3]}</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s, i) => {
                                        const a1 = getAssignment(s.id, 1);
                                        const a2 = getAssignment(s.id, 2);
                                        const a3 = getAssignment(s.id, 3);
                                        return (
                                            <tr key={s.id}>
                                                <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.phone}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{s.email}</td>
                                                <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{s.affiliation || '—'}</td>
                                                <td>
                                                    {a1 ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a1.lab_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{a1.professor_name}</div>
                                                        </div>
                                                    ) : <span style={{ color: 'var(--text3)' }}>미배정</span>}
                                                </td>
                                                <td>
                                                    {a2 ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a2.lab_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{a2.professor_name}</div>
                                                        </div>
                                                    ) : <span style={{ color: 'var(--text3)' }}>미배정</span>}
                                                </td>
                                                <td>
                                                    {a3 ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a3.lab_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{a3.professor_name}</div>
                                                        </div>
                                                    ) : <span style={{ color: 'var(--text3)' }}>미배정</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== LAB VIEW ===== */}
                {view === 'lab' && (
                    <div>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: 20, color: 'var(--text2)' }}>연구실별 세션 배정표</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                            {labs.map(lab => (
                                <div key={lab.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', breakInside: 'avoid' }}>
                                    {/* Lab header */}
                                    <div style={{ background: 'var(--surface2)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{lab.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                                            👨‍🏫 {lab.professor_name}
                                            {lab.location && <span style={{ marginLeft: 8, color: 'var(--text3)' }}>📍 {lab.location}</span>}
                                        </div>
                                    </div>
                                    {/* Sessions */}
                                    {[1, 2, 3].map(session => {
                                        const sessionStudents = getLabStudents(lab.id, session);
                                        return (
                                            <div key={session} style={{ padding: '12px 16px', borderBottom: session < 3 ? '1px solid var(--border)' : undefined }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: SESSION_COLOR[session], display: 'inline-block' }} />
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: SESSION_COLOR[session] }}>
                                                        Session {session}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{SESSION_TIME[session]}</span>
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text3)' }}>
                                                        {sessionStudents.length}명
                                                    </span>
                                                </div>
                                                {sessionStudents.length === 0 ? (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontStyle: 'italic' }}>배정 없음</div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {sessionStudents.map((a, idx) => {
                                                            const isManual = a.choice1_lab_id !== lab.id && a.choice2_lab_id !== lab.id && a.choice3_lab_id !== lab.id;
                                                            let rank = '';
                                                            if (a.choice1_lab_id === lab.id) rank = '1지망';
                                                            else if (a.choice2_lab_id === lab.id) rank = '2지망';
                                                            else if (a.choice3_lab_id === lab.id) rank = '3지망';
                                                            else rank = '임의배정';

                                                            const c1 = labs.find(l => l.id === a.choice1_lab_id)?.name;
                                                            const c2 = labs.find(l => l.id === a.choice2_lab_id)?.name;
                                                            const c3 = labs.find(l => l.id === a.choice3_lab_id)?.name;
                                                            const hasChoices = c1 || c2 || c3;

                                                            return (
                                                                <div key={a.student_id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                                                                        <span style={{ color: 'var(--text3)', minWidth: 20 }}>{idx + 1}.</span>
                                                                        <span style={{ fontWeight: 600 }}>{a.student_name}</span>
                                                                        <span style={{ color: 'var(--text3)', whiteSpace: 'nowrap' }}>{a.phone}</span>
                                                                        {a.affiliation && <span style={{ color: 'var(--text3)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {a.affiliation}</span>}
                                                                        <span className={`badge badge-${isManual ? 'None' : session}`} style={{ marginLeft: 'auto', fontSize: '0.7rem', whiteSpace: 'nowrap', background: isManual ? 'var(--bg3)' : undefined, color: isManual ? 'var(--text2)' : undefined }}>
                                                                            {rank}
                                                                        </span>
                                                                    </div>
                                                                    {isManual && hasChoices && (
                                                                        <div style={{ marginLeft: 26, fontSize: '0.72rem', color: 'var(--text3)' }}>
                                                                            ↳ 원래지망: {c1 ? `1.${c1}` : ''} {c2 ? `/ 2.${c2}` : ''} {c3 ? `/ 3.${c3}` : ''}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

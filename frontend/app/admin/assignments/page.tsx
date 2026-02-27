'use client';
import { useEffect, useState, useCallback } from 'react';

interface Lab { id: number; name: string; professor_name: string; capacity: number; }
interface Student {
    id: number; name: string; phone: string; affiliation: string;
    choice1_lab_id: number; choice2_lab_id: number; choice3_lab_id: number;
    choice1_name: string; choice2_name: string; choice3_name: string;
}
interface Assignment {
    id: number; student_id: number; session_number: number; lab_id: number;
    student_name: string; student_id_str: string; lab_name: string; professor_name: string;
    choice1_lab_id: number; choice2_lab_id: number; choice3_lab_id: number;
}

const SESSION_INFO = [
    { num: 1, time: '14:15~15:00', color: '#4f8ef7', label: 'Session 1' },
    { num: 2, time: '15:00~15:45', color: '#7c5be0', label: 'Session 2' },
    { num: 3, time: '15:45~16:30', color: '#22d3a0', label: 'Session 3' },
];

export default function AssignmentsPage() {
    const [tab, setTab] = useState(1);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRunning, setAutoRunning] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadAll = useCallback(async () => {
        const [l, s, a] = await Promise.all([
            fetch('/api/labs').then(r => r.json()),
            fetch('/api/students').then(r => r.json()),
            fetch('/api/assignments').then(r => r.json()),
        ]);
        setLabs(Array.isArray(l) ? l : []);
        setStudents(Array.isArray(s) ? s : []);
        setAssignments(Array.isArray(a) ? a : []);
        setLoading(false);
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    function getAssignment(studentId: number, session: number) {
        return assignments.find(a => a.student_id === studentId && a.session_number === session);
    }

    async function handleAssign(studentId: number, session: number, labId: number | null) {
        if (!labId) {
            // Find assignment to delete
            const asgn = getAssignment(studentId, session);
            if (asgn) {
                await fetch(`/api/assignments/${asgn.id}`, { method: 'DELETE' });
                setAssignments(prev => prev.filter(a => a.id !== asgn.id));
            }
            return;
        }
        const res = await fetch('/api/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, session_number: session, lab_id: labId }),
        });
        if (res.ok) {
            await loadAll(); // refresh to get full joined data
        }
    }

    async function autoAssign() {
        setAutoRunning(true);
        setMsg(null);
        try {
            const res = await fetch('/api/auto-assign', { method: 'POST' });
            const d = await res.json();
            if (res.ok) {
                setMsg({ type: 'success', text: `자동 배정 완료: ${d.assigned}건 배정됨` });
                await loadAll();
            } else {
                setMsg({ type: 'error', text: d.error || '자동 배정 실패' });
            }
        } finally {
            setAutoRunning(false);
        }
    }

    const sesInfo = SESSION_INFO.find(s => s.num === tab)!;
    const sessionAssignments = assignments.filter(a => a.session_number === tab);

    // Count per lab in this session
    const labCount: Record<number, number> = {};
    sessionAssignments.forEach(a => { labCount[a.lab_id] = (labCount[a.lab_id] || 0) + 1; });

    // Unassigned students in this session
    const assignedStudentIds = new Set(sessionAssignments.map(a => a.student_id));
    const unassigned = students.filter(s => !assignedStudentIds.has(s.id));

    function choiceTag(student: Student, labId: number) {
        if (student.choice1_lab_id === labId) return <span className="badge badge-1" style={{ fontSize: '0.7rem', marginLeft: 4 }}>1지망</span>;
        if (student.choice2_lab_id === labId) return <span className="badge badge-2" style={{ fontSize: '0.7rem', marginLeft: 4 }}>2지망</span>;
        if (student.choice3_lab_id === labId) return <span className="badge badge-3" style={{ fontSize: '0.7rem', marginLeft: 4 }}>3지망</span>;

        const c1 = student.choice1_name || '-';
        const c2 = student.choice2_name || '-';
        const c3 = student.choice3_name || '-';
        return <span style={{ fontSize: '0.7rem', color: 'var(--text3)', marginLeft: 6 }}>↳ 지망: 1.{c1} / 2.{c2} / 3.{c3}</span>;
    }

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>불러오는 중...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ marginBottom: 4 }}>🗓️ 세션 배정 관리</h1>
                    <p>학생을 연구실에 배정하고 수정합니다</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={loadAll}>🔄 새로고침</button>
                    <button className="btn btn-primary btn-sm" onClick={autoAssign} disabled={autoRunning}>
                        {autoRunning ? <><span className="spin">⟳</span> 배정 중...</> : '⚡ 자동 배정'}
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Session overview */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {SESSION_INFO.map(s => {
                    const cnt = assignments.filter(a => a.session_number === s.num).length;
                    return (
                        <div key={s.num} className="stat-card">
                            <div className="stat-value" style={{ color: s.color }}>{cnt}</div>
                            <div className="stat-label">{s.label} 배정 완료</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.time}</div>
                        </div>
                    );
                })}
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{students.length}</div>
                    <div className="stat-label">전체 신청자</div>
                </div>
            </div>

            {/* Tab */}
            <div className="tab-bar" style={{ marginBottom: 20 }}>
                {SESSION_INFO.map(s => (
                    <button key={s.num} className={`tab-btn ${tab === s.num ? 'active' : ''}`}
                        onClick={() => setTab(s.num)}>
                        {s.label} <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>({s.time})</span>
                    </button>
                ))}
            </div>

            {students.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                    <p>아직 신청한 학생이 없습니다</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                    {/* Assigned students */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>
                            ✅ 배정된 학생
                            <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 400, color: 'var(--text2)' }}>
                                ({sessionAssignments.length}명)
                            </span>
                        </h2>
                        {sessionAssignments.length === 0 ? (
                            <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>배정된 학생이 없습니다.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {sessionAssignments.map(a => {
                                    const stu = students.find(s => s.id === a.student_id);
                                    return (
                                        <div key={a.id} style={{
                                            background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                                        }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.student_name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{a.student_id_str}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{a.lab_name}</span>
                                                    {stu && choiceTag(stu, a.lab_id)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <select
                                                    value={a.lab_id}
                                                    style={{ width: 140, padding: '4px 8px', fontSize: '0.8rem' }}
                                                    onChange={e => handleAssign(a.student_id, tab, Number(e.target.value))}
                                                >
                                                    {labs.map(l => (
                                                        <option key={l.id} value={l.id}>{l.name}</option>
                                                    ))}
                                                </select>
                                                <button className="btn btn-danger btn-sm"
                                                    onClick={() => handleAssign(a.student_id, tab, null)}
                                                    title="배정 취소">✕</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right panel: unassigned + lab capacity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Unassigned */}
                        <div className="card">
                            <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>
                                ⏳ 미배정 학생
                                <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 400, color: 'var(--text2)' }}>
                                    ({unassigned.length}명)
                                </span>
                            </h2>
                            {unassigned.length === 0 ? (
                                <p style={{ color: 'var(--success)', fontSize: '0.9rem' }}>✅ 모든 학생이 배정되었습니다!</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {unassigned.map(s => (
                                        <div key={s.id} style={{
                                            background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
                                                    {s.name} <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 400 }}>{s.phone}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'flex', gap: 4 }}>
                                                    {s.choice1_name && <span className="badge badge-1">{s.choice1_name}</span>}
                                                    {s.choice2_name && <span className="badge badge-2">{s.choice2_name}</span>}
                                                    {s.choice3_name && <span className="badge badge-3">{s.choice3_name}</span>}
                                                </div>
                                            </div>
                                            <select
                                                defaultValue=""
                                                style={{ width: 140, padding: '4px 8px', fontSize: '0.8rem' }}
                                                onChange={e => { if (e.target.value) handleAssign(s.id, tab, Number(e.target.value)); e.target.value = ''; }}
                                            >
                                                <option value="">연구실 선택</option>
                                                {labs.map(l => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.name} ({labCount[l.id] || 0}/{l.capacity})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Lab capacity */}
                        <div className="card">
                            <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>
                                🔬 연구실별 현황
                                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text2)', marginLeft: 8 }}>(배정/정원)</span>
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {labs.map(l => {
                                    const cnt = labCount[l.id] || 0;
                                    const pct = Math.min((cnt / l.capacity) * 100, 100);
                                    const full = cnt >= l.capacity;
                                    return (
                                        <div key={l.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                                <span style={{ fontWeight: 500 }}>{l.name}</span>
                                                <span style={{ color: full ? 'var(--danger)' : 'var(--text2)' }}>
                                                    {cnt}/{l.capacity} {full && '(정원 초과)'}
                                                </span>
                                            </div>
                                            <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', width: `${pct}%`, borderRadius: 3,
                                                    background: full ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : sesInfo.color,
                                                    transition: 'width 0.3s'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

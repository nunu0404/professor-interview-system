'use client';
import { useEffect, useState, useCallback } from 'react';

interface Lab {
    id: number; name: string; professor_name: string;
    capacity: number; description: string; location: string;
}

const EMPTY_LAB = { name: '', professor_name: '', capacity: 5, description: '', location: '' };

export default function LabsPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [editing, setEditing] = useState<Partial<Lab> | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_LAB });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const load = useCallback(() => {
        fetch('/api/labs').then(r => r.json()).then(d => setLabs(Array.isArray(d) ? d : []));
    }, []);
    useEffect(() => { load(); }, [load]);

    function startEdit(lab: Lab) {
        setEditing(lab);
        setForm({ name: lab.name, professor_name: lab.professor_name, capacity: lab.capacity, description: lab.description || '', location: lab.location || '' });
        setAdding(false);
    }
    function startAdd() { setAdding(true); setEditing(null); setForm({ ...EMPTY_LAB }); }
    function cancel() { setEditing(null); setAdding(false); }

    async function save() {
        setSaving(true);
        setMsg(null);
        try {
            let res;
            if (editing) {
                res = await fetch(`/api/labs/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            } else {
                res = await fetch('/api/labs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            }
            if (res.ok) {
                setMsg({ type: 'success', text: editing ? '연구실이 수정되었습니다.' : '연구실이 추가되었습니다.' });
                cancel(); load();
            } else {
                const d = await res.json();
                setMsg({ type: 'error', text: d.error || '저장 실패' });
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteLab(id: number, name: string) {
        if (!confirm(`"${name}" 연구실을 삭제할까요? 관련 배정 데이터도 함께 삭제됩니다.`)) return;
        const res = await fetch(`/api/labs/${id}`, { method: 'DELETE' });
        if (res.ok) { setMsg({ type: 'success', text: '삭제되었습니다.' }); load(); }
        else setMsg({ type: 'error', text: '삭제 실패' });
    }

    const FormPanel = () => (
        <div className="card" style={{ marginBottom: 24. }}>
            <h2 style={{ fontSize: '1rem', marginBottom: 20 }}>
                {editing ? '✏️ 연구실 수정' : '➕ 연구실 추가'}
            </h2>
            <div className="form-row">
                <div className="form-group">
                    <label>연구실명 *</label>
                    <input type="text" placeholder="OO 연구실" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label>교수명 *</label>
                    <input type="text" placeholder="홍길동 교수" value={form.professor_name} onChange={e => setForm(p => ({ ...p, professor_name: e.target.value }))} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>세션당 정원</label>
                    <input type="number" min={1} max={30} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                    <label>위치</label>
                    <input type="text" placeholder="E3-401" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
            </div>
            <div className="form-group">
                <label>연구실 소개</label>
                <textarea rows={2} placeholder="연구 분야 및 소개를 입력하세요" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.professor_name}>
                    {saving ? <><span className="spin">⟳</span> 저장 중...</> : '💾 저장'}
                </button>
                <button className="btn btn-secondary" onClick={cancel}>취소</button>
            </div>
        </div>
    );

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ marginBottom: 4 }}>🔬 연구실 관리</h1>
                    <p>연구실 목록을 추가·수정·삭제합니다</p>
                </div>
                {!adding && !editing && (
                    <button className="btn btn-primary btn-sm" onClick={startAdd}>➕ 연구실 추가</button>
                )}
            </div>

            {msg && (
                <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {(adding || editing) && <FormPanel />}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>연구실명</th>
                            <th>교수명</th>
                            <th>세션당 정원</th>
                            <th>위치</th>
                            <th>소개</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labs.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>연구실이 없습니다</td></tr>
                        ) : labs.map((lab, i) => (
                            <tr key={lab.id}>
                                <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                                <td style={{ fontWeight: 600 }}>{lab.name}</td>
                                <td style={{ color: 'var(--text2)' }}>{lab.professor_name}</td>
                                <td style={{ textAlign: 'center' }}><span className="badge badge-1">{lab.capacity}명</span></td>
                                <td style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>{lab.location || '—'}</td>
                                <td style={{ color: 'var(--text2)', fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {lab.description || '—'}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(lab)}>✏️ 수정</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteLab(lab.id, lab.name)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

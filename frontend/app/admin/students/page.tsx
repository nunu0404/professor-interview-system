'use client';
import React, { useEffect, useState, useCallback } from 'react';

interface Student {
    id: number; name: string; phone: string; email: string; affiliation: string;
    choice1_lab_id: number; choice1_name: string; choice1_professor: string;
    choice2_lab_id: number; choice2_name: string; choice2_professor: string;
    choice3_lab_id: number; choice3_name: string; choice3_professor: string;
    created_at: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(() => {
        fetch('/api/students').then(r => r.json()).then(d => {
            setStudents(Array.isArray(d) ? d : []);
            setLoading(false);
        });
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/students/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                alert(`성공적으로 ${data.count}명의 학생 데이터를 업로드했습니다!`);
                load();
            } else {
                alert(`업로드 실패: ${data.error}`);
            }
        } catch (e) {
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const filtered = students.filter(s =>
        s.name.includes(search) || s.phone.includes(search) || s.email.includes(search) || (s.affiliation || '').includes(search)
    );

    function choiceBadge(choice: number, name: string) {
        if (!name) return <span style={{ color: 'var(--text3)' }}>—</span>;
        return <span className={`badge badge-${choice}`}>{choice}지망: {name}</span>;
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ marginBottom: 4 }}>👥 학생 신청 목록</h1>
                    <p>총 <strong style={{ color: 'var(--accent)' }}>{students.length}명</strong> 신청 완료</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <span className="spin">⟳</span> : '📤 CSV 일괄 등록'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={load}>🔄 새로고침</button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
                <input
                    type="text" placeholder="🔍 이름, 연락처, 이메일, 소속으로 검색..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 360 }}
                />
            </div>

            {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>불러오는 중...</div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                    <p>{search ? '검색 결과가 없습니다.' : '아직 신청한 학생이 없습니다.'}</p>
                </div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>이름</th>
                                <th>연락처</th>
                                <th>이메일</th>
                                <th>소속</th>
                                <th>1지망</th>
                                <th>2지망</th>
                                <th>3지망</th>
                                <th>신청 시각</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <tr key={s.id}>
                                    <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--text2)', fontSize: '0.9rem' }}>{s.phone}</td>
                                    <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{s.email}</td>
                                    <td style={{ color: 'var(--text2)' }}>{s.affiliation || '—'}</td>
                                    <td>{choiceBadge(1, s.choice1_name)}</td>
                                    <td>{choiceBadge(2, s.choice2_name)}</td>
                                    <td>{choiceBadge(3, s.choice3_name)}</td>
                                    <td style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>
                                        {new Date(s.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/admin';
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            if (data.role === 'viewer') {
                window.location.href = '/admin/print';
            } else {
                window.location.href = from;
            }
        } catch {
            setError('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.1) 0%, var(--bg) 70%)',
            padding: 24,
        }}>
            <div className="card fade-in" style={{ maxWidth: 400, width: '100%', padding: '40px 32px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16, background: 'var(--accent-grad)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
                        margin: '0 auto 16px'
                    }}>🔐</div>
                    <h1 style={{ fontSize: '1.4rem', marginBottom: 6 }}>관리자 로그인</h1>
                    <p style={{ fontSize: '0.85rem' }}>학과 소개의 날 — 관리자 시스템</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>비밀번호</label>
                        <input
                            id="admin-password"
                            type="password"
                            placeholder="관리자 비밀번호 입력"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                    <button type="submit" className="btn btn-primary" id="login-btn"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
                        {loading ? <><span className="spin">⟳</span> 로그인 중...</> : '로그인'}
                    </button>
                </form>

            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>로딩 중...</div>}>
            <LoginForm />
        </Suspense>
    );
}

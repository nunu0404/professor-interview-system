'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
    { href: '/admin', label: '📊 대시보드', exact: true },
    { href: '/admin/students', label: '👥 학생 목록' },
    { href: '/admin/assignments', label: '🗓️ 세션 배정' },
    { href: '/admin/labs', label: '🔬 연구실 관리' },
    { href: '/admin/print', label: '🖨️ 배정 명단' },
    { href: '/admin/settings', label: '⚙️ 설정' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<'admin' | 'viewer' | null>(null);

    useEffect(() => {
        fetch('/api/auth', { method: 'GET', cache: 'no-store' })
            .then(res => res.json())
            .then(data => setRole(data.role))
            .catch(() => setRole(null));
    }, [pathname]);

    async function logout() {
        await fetch('/api/auth', { method: 'DELETE' });
        router.replace('/admin/login');
    }

    // Don't block the login page with auth check
    if (pathname === '/admin/login') {
        return <div className="admin-layout-root">{children}</div>;
    }

    if (role === null || role === undefined) {
        return (
            <div className="admin-layout-root">
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="spin" style={{ fontSize: '2rem' }}>⟳</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout-root">
            <nav className="nav">
                {role === 'admin' ? (
                    <Link href="/" className="nav-brand">
                        <div className="nav-logo">🎓</div>
                        <span>학과 소개의 날 — 관리자</span>
                    </Link>
                ) : (
                    <div className="nav-brand" style={{ cursor: 'default' }}>
                        <div className="nav-logo">🎓</div>
                        <span>학과 소개의 날 — 관리자</span>
                    </div>
                )}
                <div className="nav-links">
                    {NAV_LINKS.filter(l => role === 'admin' || l.href === '/admin/print').map(l => {
                        const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
                        return (
                            <Link key={l.href} href={l.href} className={`nav-link ${isActive ? 'active' : ''}`}>
                                {l.label}
                            </Link>
                        );
                    })}
                    <button onClick={logout} className="nav-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500 }}>
                        🔓 로그아웃
                    </button>
                </div>
            </nav>
            <main className="page">{children}</main>
        </div>
    );
}


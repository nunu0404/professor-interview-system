'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

    async function logout() {
        await fetch('/api/auth', { method: 'DELETE' });
        router.replace('/admin/login');
    }

    return (
        <>
            <nav className="nav">
                <Link href="/" className="nav-brand">
                    <div className="nav-logo">🎓</div>
                    <span>학과 소개의 날 — 관리자</span>
                </Link>
                <div className="nav-links">
                    {NAV_LINKS.map(l => {
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
        </>
    );
}


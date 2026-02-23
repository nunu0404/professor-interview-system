import { NextResponse, NextRequest } from 'next/server';

const ADMIN_COOKIE = 'admin_auth';
const TOKEN_VALUE = process.env.ADMIN_TOKEN || 'openlab2026';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /admin routes (except /admin/login)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const token = request.cookies.get(ADMIN_COOKIE)?.value;
        if (token !== TOKEN_VALUE) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};

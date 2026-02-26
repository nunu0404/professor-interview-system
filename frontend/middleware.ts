import { NextResponse, NextRequest } from 'next/server';

const ADMIN_COOKIE = 'admin_auth';
const TOKEN_VALUE = process.env.ADMIN_TOKEN || 'openlab2026';
const VIEWER_TOKEN = process.env.VIEWER_TOKEN || 'viewer2026';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /admin routes (except /admin/login)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const token = request.cookies.get(ADMIN_COOKIE)?.value;
        const isAdmin = token === TOKEN_VALUE;
        const isViewer = token === VIEWER_TOKEN;

        if (!isAdmin && !isViewer) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Viewer is strictly limited to /admin/print
        if (isViewer && pathname !== '/admin/print') {
            return NextResponse.redirect(new URL('/admin/print', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};

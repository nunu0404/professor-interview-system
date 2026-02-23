import { NextResponse } from 'next/server';

const ADMIN_COOKIE = 'admin_auth';
const PASSWORD = process.env.ADMIN_PASSWORD || 'openlab2026';
const TOKEN_VALUE = process.env.ADMIN_TOKEN || 'openlab2026';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();
        if (password !== PASSWORD) {
            return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }
        const res = NextResponse.json({ success: true });
        res.cookies.set(ADMIN_COOKIE, TOKEN_VALUE, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 12, // 12 hours
            path: '/',
        });
        return res;
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE() {
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE, '', { maxAge: 0, path: '/' });
    return res;
}

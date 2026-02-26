import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_auth';
const PASSWORD = process.env.ADMIN_PASSWORD || 'openlab2026';
const TOKEN_VALUE = process.env.ADMIN_TOKEN || 'openlab2026';
const VIEWER_PASSWORD = process.env.VIEWER_PASSWORD || 'viewer2026';
const VIEWER_TOKEN = process.env.VIEWER_TOKEN || 'viewer2026';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();
        let tokenToSet = '';

        if (password === PASSWORD) {
            tokenToSet = TOKEN_VALUE;
        } else if (password === VIEWER_PASSWORD) {
            tokenToSet = VIEWER_TOKEN;
        } else {
            return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        const res = NextResponse.json({ success: true, role: password === PASSWORD ? 'admin' : 'viewer' });
        res.cookies.set(ADMIN_COOKIE, tokenToSet, {
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

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;

    let role = null;
    if (token === TOKEN_VALUE) {
        role = 'admin';
    } else if (token === VIEWER_TOKEN) {
        role = 'viewer';
    }

    return NextResponse.json({ role });
}

export async function DELETE() {
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE, '', { maxAge: 0, path: '/' });
    return res;
}

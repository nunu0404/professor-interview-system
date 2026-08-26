import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const surveys = db.prepare('SELECT * FROM surveys ORDER BY created_at DESC').all();
        return NextResponse.json(surveys);
    } catch (error) {
        console.error('Failed to get surveys:', error);
        return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, affiliation, phone, email, q2, q3, q4, q5, q6, q7 } = body;

        if (!name || !affiliation || !phone || !email || !q2 || !q3 || !q4 || !q5 || !q6) {
            return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
        }

        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO surveys (name, affiliation, phone, email, q2, q3, q4, q5, q6, q7)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(name, affiliation, phone, email, q2, q3, q4, q5, q6, q7 || '');

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('Failed to submit survey:', error);
        return NextResponse.json({ error: '서버 오류로 인해 제출에 실패했습니다.' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const labs = db.prepare('SELECT * FROM labs ORDER BY id').all();
        return NextResponse.json(labs);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const db = getDb();
        const body = await req.json();
        const { name, professor_name, capacity, description, location } = body;
        if (!name || !professor_name) {
            return NextResponse.json({ error: '연구실명과 교수명은 필수입니다.' }, { status: 400 });
        }
        const result = db.prepare(
            'INSERT INTO labs (name, professor_name, capacity, description, location) VALUES (?, ?, ?, ?, ?)'
        ).run(name, professor_name, capacity ?? 5, description ?? '', location ?? '');
        const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(lab, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

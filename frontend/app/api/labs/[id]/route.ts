import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = getDb();
        const body = await req.json();
        const { name, professor_name, capacity, description, location } = body;
        const { id } = await params;
        db.prepare(
            'UPDATE labs SET name=?, professor_name=?, capacity=?, description=?, location=? WHERE id=?'
        ).run(name, professor_name, capacity, description, location, id);
        const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(id);
        return NextResponse.json(lab);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = getDb();
        const { id } = await params;
        db.prepare('DELETE FROM labs WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(req: Request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const target = searchParams.get('target') || 'all'; // all | students | assignments

        db.transaction(() => {
            if (target === 'assignments' || target === 'all') {
                db.prepare('DELETE FROM assignments').run();
            }
            if (target === 'students' || target === 'all') {
                db.prepare('DELETE FROM students').run();
                db.prepare('DELETE FROM assignments').run();
            }
        })();

        return NextResponse.json({ success: true, target });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

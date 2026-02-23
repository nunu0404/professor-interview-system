import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const db = getDb();
        const { id } = await params;
        db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

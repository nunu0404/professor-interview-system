import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const assignments = db.prepare(`
      SELECT 
        a.*,
        s.name as student_name, s.phone as student_id_str, s.affiliation,
        s.choice1_lab_id, s.choice2_lab_id, s.choice3_lab_id,
        l.name as lab_name, l.professor_name
      FROM assignments a
      JOIN students s ON a.student_id = s.id
      JOIN labs l ON a.lab_id = l.id
      ORDER BY a.session_number, s.name
    `).all();
        return NextResponse.json(assignments);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const db = getDb();
        const body = await req.json();
        const { student_id, session_number, lab_id } = body;

        if (!student_id || !session_number || !lab_id) {
            return NextResponse.json({ error: '학생, 세션, 연구실은 필수입니다.' }, { status: 400 });
        }

        // Upsert: insert or replace
        db.prepare(`
      INSERT INTO assignments (student_id, session_number, lab_id, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, session_number)
      DO UPDATE SET lab_id = excluded.lab_id, updated_at = CURRENT_TIMESTAMP
    `).run(student_id, session_number, lab_id);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

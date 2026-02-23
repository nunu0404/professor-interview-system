import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');
        const name = searchParams.get('name');

        if (!phone || !name) {
            return NextResponse.json({ error: '연락처와 이름을 모두 입력해주세요.' }, { status: 400 });
        }

        const db = getDb();

        // 1. Check if results are published
        const setting = db.prepare("SELECT value FROM settings WHERE key = 'results_published'").get() as { value: string } | undefined;
        const isPublished = setting?.value === 'true';

        if (!isPublished) {
            return NextResponse.json({ published: false });
        }

        const student = db.prepare(`
      SELECT s.*, 
        l1.name as choice1_name, l1.professor_name as choice1_professor,
        l2.name as choice2_name, l2.professor_name as choice2_professor,
        l3.name as choice3_name, l3.professor_name as choice3_professor
      FROM students s
      LEFT JOIN labs l1 ON s.choice1_lab_id = l1.id
      LEFT JOIN labs l2 ON s.choice2_lab_id = l2.id
      LEFT JOIN labs l3 ON s.choice3_lab_id = l3.id
      WHERE REPLACE(s.phone, '-', '') = REPLACE(?, '-', '') AND s.name = ?
    `).get(phone, name) as Record<string, string | number> | undefined;

        if (!student) {
            return NextResponse.json({ error: '입력하신 연락처와 이름으로 신청된 내역이 없습니다.' }, { status: 404 });
        }

        const sessions = db.prepare(`
      SELECT a.session_number, l.name as lab_name, l.professor_name, l.location
      FROM assignments a
      JOIN labs l ON a.lab_id = l.id
      WHERE a.student_id = ?
      ORDER BY a.session_number
    `).all(student.id) as { session_number: number; lab_name: string; professor_name: string; location: string }[];

        const choices = [
            { choice: 1, name: student.choice1_name as string, professor: student.choice1_professor as string },
            { choice: 2, name: student.choice2_name as string, professor: student.choice2_professor as string },
            { choice: 3, name: student.choice3_name as string, professor: student.choice3_professor as string },
        ].filter(c => c.name);

        return NextResponse.json({
            name: student.name,
            student_id: student.student_id,
            affiliation: student.affiliation,
            sessions,
            choices,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

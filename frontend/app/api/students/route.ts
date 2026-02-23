import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const students = db.prepare(`
      SELECT 
        s.*,
        l1.name as choice1_name, l1.professor_name as choice1_professor,
        l2.name as choice2_name, l2.professor_name as choice2_professor,
        l3.name as choice3_name, l3.professor_name as choice3_professor
      FROM students s
      LEFT JOIN labs l1 ON s.choice1_lab_id = l1.id
      LEFT JOIN labs l2 ON s.choice2_lab_id = l2.id
      LEFT JOIN labs l3 ON s.choice3_lab_id = l3.id
      ORDER BY s.created_at DESC
    `).all();
        return NextResponse.json(students);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const db = getDb();
        const body = await req.json();
        const { name, phone, email, affiliation, choice1_lab_id, choice2_lab_id, choice3_lab_id } = body;

        if (!name || !phone || !email) {
            return NextResponse.json({ error: '이름, 연락처, 이메일은 필수입니다.' }, { status: 400 });
        }
        if (!choice1_lab_id) {
            return NextResponse.json({ error: '1지망 연구실을 선택해주세요.' }, { status: 400 });
        }
        // Validate no duplicate choices
        const choices = [choice1_lab_id, choice2_lab_id, choice3_lab_id].filter(Boolean);
        if (new Set(choices).size !== choices.length) {
            return NextResponse.json({ error: '같은 연구실을 중복 선택할 수 없습니다.' }, { status: 400 });
        }

        // Check duplicate phone
        const existing = db.prepare("SELECT id FROM students WHERE REPLACE(phone, '-', '') = REPLACE(?, '-', '')").get(phone);
        if (existing) {
            return NextResponse.json({ error: '이미 신청한 연락처입니다.' }, { status: 409 });
        }

        const result = db.prepare(`
      INSERT INTO students (name, phone, email, affiliation, choice1_lab_id, choice2_lab_id, choice3_lab_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, email, affiliation ?? '', choice1_lab_id, choice2_lab_id ?? null, choice3_lab_id ?? null);

        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(student, { status: 201 });
    } catch (e: unknown) {
        if (e instanceof Error && e.message.includes('UNIQUE')) {
            return NextResponse.json({ error: '이미 신청한 연락처입니다.' }, { status: 409 });
        }
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

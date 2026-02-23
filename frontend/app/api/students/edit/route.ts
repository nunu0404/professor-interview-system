import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET: look up existing application by student_id
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');

    if (!phone || !name) {
        return NextResponse.json({ error: '연락처와 이름을 모두 입력해주세요.' }, { status: 400 });
    }
    const db = getDb();
    const student = db.prepare(`
    SELECT s.*, l1.name as c1_name, l2.name as c2_name, l3.name as c3_name
    FROM students s
    LEFT JOIN labs l1 ON s.choice1_lab_id = l1.id
    LEFT JOIN labs l2 ON s.choice2_lab_id = l2.id
    LEFT JOIN labs l3 ON s.choice3_lab_id = l3.id
    WHERE REPLACE(s.phone, '-', '') = REPLACE(?, '-', '') AND s.name = ?
  `).get(phone, name);
    if (!student) return NextResponse.json({ error: '신청 내역 없음' }, { status: 404 });
    return NextResponse.json(student);
}

// PUT: update an existing application's lab choices
export async function PUT(req: Request) {
    try {
        const db = getDb();
        const body = await req.json();
        const { id, choice1_lab_id, choice2_lab_id, choice3_lab_id, phone, name } = body; // keeping phone and name for validation if needed

        if (!id) {
            return NextResponse.json({ error: 'ID 필요' }, { status: 400 });
        }

        const existing = db.prepare('SELECT id FROM students WHERE id = ?').get(id) as { id: number } | undefined;
        if (!existing) {
            return NextResponse.json({ error: '신청 내역 없음' }, { status: 404 });
        }

        // Validate no duplicate choices
        const choices = [choice1_lab_id, choice2_lab_id, choice3_lab_id].filter(Boolean);
        if (new Set(choices).size !== choices.length) {
            return NextResponse.json({ error: '같은 연구실을 중복 선택할 수 없습니다.' }, { status: 400 });
        }

        db.prepare(`
            UPDATE students 
            SET choice1_lab_id = ?, choice2_lab_id = ?, choice3_lab_id = ?
            WHERE id = ?
        `).run(choice1_lab_id, choice2_lab_id || null, choice3_lab_id || null, id);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

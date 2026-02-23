import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const students = db.prepare(`
      SELECT 
        s.name, s.phone, s.email, s.affiliation, s.created_at,
        l1.name as choice1_name, l1.professor_name as choice1_professor,
        l2.name as choice2_name, l2.professor_name as choice2_professor,
        l3.name as choice3_name, l3.professor_name as choice3_professor,
        a1.lab_id as session1_lab_id, lab1.name as session1_name,
        a2.lab_id as session2_lab_id, lab2.name as session2_name,
        a3.lab_id as session3_lab_id, lab3.name as session3_name
      FROM students s
      LEFT JOIN labs l1 ON s.choice1_lab_id = l1.id
      LEFT JOIN labs l2 ON s.choice2_lab_id = l2.id
      LEFT JOIN labs l3 ON s.choice3_lab_id = l3.id
      LEFT JOIN assignments a1 ON a1.student_id = s.id AND a1.session_number = 1
      LEFT JOIN labs lab1 ON lab1.id = a1.lab_id
      LEFT JOIN assignments a2 ON a2.student_id = s.id AND a2.session_number = 2
      LEFT JOIN labs lab2 ON lab2.id = a2.lab_id
      LEFT JOIN assignments a3 ON a3.student_id = s.id AND a3.session_number = 3
      LEFT JOIN labs lab3 ON lab3.id = a3.lab_id
      ORDER BY s.name
    `).all() as Record<string, string>[];

        const header = [
            '이름', '연락처', '이메일', '소속',
            '1지망', '1지망 교수',
            '2지망', '2지망 교수',
            '3지망', '3지망 교수',
            'Session1 배정 연구실',
            'Session2 배정 연구실',
            'Session3 배정 연구실',
            '신청 시각',
        ].join(',');

        const rows = students.map(s =>
            [
                s.name, s.phone || '', s.email || '', s.affiliation || '',
                s.choice1_name || '', s.choice1_professor || '',
                s.choice2_name || '', s.choice2_professor || '',
                s.choice3_name || '', s.choice3_professor || '',
                s.session1_name || '',
                s.session2_name || '',
                s.session3_name || '',
                s.created_at,
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
        );

        const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Korean Excel
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="openlab_students.csv"',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

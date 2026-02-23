import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const assignments = db.prepare(`
            SELECT 
                a.session_number,
                s.name as student_name,
                s.phone,
                s.email,
                l.name as lab_name,
                l.professor_name
            FROM assignments a
            JOIN students s ON a.student_id = s.id
            JOIN labs l ON a.lab_id = l.id
            ORDER BY a.session_number ASC, l.name ASC, s.name ASC
        `).all() as {
            session_number: number;
            student_name: string;
            phone: string;
            email: string;
            lab_name: string;
            professor_name: string;
        }[];

        const header = ['세션', '이름', '연락처', '이메일', '배정 연구실', '지도교수'].join(',');
        const rows = assignments.map(a =>
            [
                `Session ${a.session_number}`,
                `"${a.student_name}"`,
                a.phone,
                `"${a.email}"`,
                `"${a.lab_name}"`,
                `"${a.professor_name}"`
            ].join(',')
        );

        const csv = [header, ...rows].join('\n');

        return new NextResponse('\uFEFF' + csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="assignments.csv"',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

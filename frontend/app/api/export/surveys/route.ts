import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const surveys = db.prepare('SELECT * FROM surveys ORDER BY created_at ASC').all() as Record<string, string>[];

        const header = [
            '제출 일시',
            'Q2. 알게 된 경로', 'Q3. 참석하게 된 이유', 'Q4. 관심을 갖게 된 이유',
            'Q5. 진학 결정에 도움', 'Q6. 개최 요일 선호도', 'Q7. 개선할 점'
        ].join(',');

        const rows = surveys.map(s =>
            [
                s.created_at,
                s.q2, s.q3, s.q4,
                s.q5, s.q6, s.q7 || ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
        );

        const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Korean Excel
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="survey_results.csv"',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

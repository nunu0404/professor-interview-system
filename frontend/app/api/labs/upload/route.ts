import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import * as xlsx from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });

        // Use the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parse to JSON array (2D array format)
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rows.length < 2) {
            return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 });
        }

        // Find the header row by searching the first 10 rows
        let headerRowIdx = -1;
        let idxName = -1;
        let idxProf = -1;
        let headers: string[] = [];

        for (let i = 0; i < Math.min(10, rows.length); i++) {
            const currentHeaders = rows[i].map(h => String(h || '').trim().replace(/\s+/g, ''));
            const nIdx = currentHeaders.findIndex(h => h.includes('연구실') || h.includes('랩'));
            const pIdx = currentHeaders.findIndex(h => h.includes('교수'));

            if (nIdx !== -1 && pIdx !== -1) {
                headerRowIdx = i;
                idxName = nIdx;
                idxProf = pIdx;
                headers = currentHeaders;
                break;
            }
        }

        if (headerRowIdx === -1) {
            // Just grab the first row for the error message
            const sampleHeaders = rows[0] ? rows[0].map(h => String(h || '').trim()).join(', ') : '없음';
            return NextResponse.json({
                error: `연구실명 및 교수명 열을 포함하는 헤더 행을 찾을 수 없습니다. (첫 행 데이터: ${sampleHeaders})`
            }, { status: 400 });
        }

        const db = getDb();
        const insert = db.prepare(`
            INSERT INTO labs (name, professor_name, capacity, location)
            VALUES (?, ?, ?, ?)
        `);

        let count = 0;

        db.transaction(() => {
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                const rawName = String(row[idxName] || '').trim();
                const rawProf = String(row[idxProf] || '').trim();

                // Skip if both are empty
                if (!rawName && !rawProf) continue;

                // Extract capacity if exists, otherwise default to 5
                // Extract location if exists, otherwise default to empty string
                // But since user didn't request capacity/location columns, we'll just use defaults

                insert.run(rawName || '이름 없음', rawProf || '교수 미지정', 5, '');
                count++;
            }
        })();

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error('Lab Upload error:', error);
        return NextResponse.json({ error: '업로드 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

import * as xlsx from 'xlsx';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to 2D array, filter out completely empty rows
        const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        const rows = rawRows.filter(row => Array.isArray(row) && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''));

        if (rows.length < 2) {
            return NextResponse.json({ error: '헤더 제외 유효한 데이터가 없습니다.' }, { status: 400 });
        }

        // CSV Headers from provided image:
        // No., 신청자구분, 신청자명, 휴대전화번호, 이메일주소, 대학교명/기타, 학과명/부..., 과정, 학년, 셔틀버스이용여부,
        // 지원예정전공, 지원과정, 희망전공, 희망연구실1, 희망연구실2, 희망연구실3, 신청상태, 취소일시
        const headers = rows[0].map(h => String(h || '').trim());

        const idxName = headers.findIndex(h => h.includes('신청자명'));
        const idxPhone = headers.findIndex(h => h.includes('휴대전화번호'));
        const idxEmail = headers.findIndex(h => h.includes('이메일주소'));
        const idxUniv = headers.findIndex(h => h.includes('대학교명'));
        const idxDept = headers.findIndex(h => h.includes('학과명'));
        const idxC1 = headers.findIndex(h => {
            const norm = h.replace(/\s+/g, '');
            return norm.includes('희망연구실1') || norm.includes('1지망');
        });
        const idxC2 = headers.findIndex(h => {
            const norm = h.replace(/\s+/g, '');
            return norm.includes('희망연구실2') || norm.includes('2지망');
        });
        const idxC3 = headers.findIndex(h => {
            const norm = h.replace(/\s+/g, '');
            return norm.includes('희망연구실3') || norm.includes('3지망');
        });

        if (idxName === -1 || idxPhone === -1) {
            return NextResponse.json({ error: '신청자명 또는 휴대전화번호 열을 찾을 수 없습니다.' }, { status: 400 });
        }

        const db = getDb();
        const labs = db.prepare('SELECT id, name, professor_name FROM labs').all() as { id: number, name: string, professor_name: string }[];

        // Normalize lab name function
        const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
        const findLabId = (choice: string) => {
            if (!choice || choice === '-') return null;
            const normChoice = normalize(choice);
            const match = labs.find(l => {
                const nName = normalize(l.name);
                const nProf = normalize(l.professor_name);
                const nProfShort = nProf.replace('교수', '');
                return nName.includes(normChoice) || normChoice.includes(nName) ||
                    nProf.includes(normChoice) || normChoice.includes(nProf) ||
                    (nProfShort.length > 1 && (nProfShort.includes(normChoice) || normChoice.includes(nProfShort)));
            });
            return match ? match.id : null;
        };

        const insert = db.prepare(`
            INSERT INTO students (name, phone, email, affiliation, choice1_lab_id, choice2_lab_id, choice3_lab_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET
                name=excluded.name,
                email=excluded.email,
                affiliation=excluded.affiliation,
                choice1_lab_id=excluded.choice1_lab_id,
                choice2_lab_id=excluded.choice2_lab_id,
                choice3_lab_id=excluded.choice3_lab_id
        `);

        let successCount = 0;

        db.transaction(() => {
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i].map(c => String(c || '').trim());
                const name = cols[idxName] || '';
                const phone = cols[idxPhone] ? cols[idxPhone].replace(/[^0-9]/g, '') : '';
                if (!name || !phone) continue;

                const email = idxEmail !== -1 ? cols[idxEmail] : '';
                let affiliationParts = [];
                if (idxUniv !== -1 && cols[idxUniv] && cols[idxUniv] !== '-') affiliationParts.push(cols[idxUniv]);
                if (idxDept !== -1 && cols[idxDept] && cols[idxDept] !== '-') affiliationParts.push(cols[idxDept]);
                const affiliation = affiliationParts.join(' ');

                const l1 = idxC1 !== -1 ? findLabId(cols[idxC1]) : null;
                const l2 = idxC2 !== -1 ? findLabId(cols[idxC2]) : null;
                const l3 = idxC3 !== -1 ? findLabId(cols[idxC3]) : null;

                insert.run(name, phone, email, affiliation, l1, l2, l3);
                successCount++;
            }
        })();

        return NextResponse.json({ success: true, count: successCount });

    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

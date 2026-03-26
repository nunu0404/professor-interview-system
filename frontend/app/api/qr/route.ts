import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { headers } from 'next/headers';
import { networkInterfaces } from 'os';

export const dynamic = 'force-dynamic';

function getNetworkIp() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        // Order of precedence:
        // 1. ?target= or ?url= query parameter
        // 2. NEXT_PUBLIC_BASE_URL (for static QR codes across different environments)
        // 3. Dynamic host detection (current behavior)
        let applyUrl = searchParams.get('target') || searchParams.get('url');
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        if (!applyUrl || applyUrl === 'null' || applyUrl === 'undefined') {
            const finalBaseUrl = baseUrl || 'http://3.36.16.74:3000';
            // remove trailing slash if exists
            const cleanBase = finalBaseUrl.endsWith('/') ? finalBaseUrl.slice(0, -1) : finalBaseUrl;
            applyUrl = `${cleanBase}/apply`;
        }

        const qrDataUrl = await QRCode.toDataURL(applyUrl, {
            width: 400,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' },
            errorCorrectionLevel: 'H',
        });

        // Return as PNG image
        const base64 = qrDataUrl.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

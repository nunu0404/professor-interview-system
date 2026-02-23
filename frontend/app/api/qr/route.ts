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
        // Allow custom URL override via ?target= or ?url=
        let applyUrl = searchParams.get('target') || searchParams.get('url');
        if (!applyUrl || applyUrl === 'null' || applyUrl === 'undefined') {
            const headersList = await headers();
            let host = headersList.get('host') || 'localhost:3000';

            // IMPORTANT: If host is localhost, replace it with the network IP
            // so phones scanning the QR can actually connect
            if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
                const port = host.split(':')[1] || '3000';
                const ip = getNetworkIp();
                if (ip !== 'localhost') {
                    host = `${ip}:${port}`;
                }
            }

            // Use 'http' for localhost or local IP addresses (starts with 192, 10, 172, or 127)
            const isLocal = host.startsWith('localhost') ||
                host.match(/^(192|10|172\.1[6-9]|172\.2[0-9]|172\.3[0-1]|127)\./) !== null;
            const proto = isLocal ? 'http' : 'https';

            applyUrl = `${proto}://${host}/apply`;
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

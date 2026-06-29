import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Renderiza sob demanda em runtime (cacheado pela Vercel). Evita o prerender no
// build, que dispara um bug do @vercel/og no Windows (fileURLToPath → "Invalid URL").
export const dynamic = 'force-dynamic';
export const alt = 'MilWeb — Sites e sistemas que dão resultado';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Fonte embutida no repo e lida do disco (sem rede em runtime). Fornecer a
// fonte explicitamente evita o carregador de fonte padrão do @vercel/og, que
// quebra no build/Windows (fileURLToPath → "Invalid URL").
export default async function Image() {
  const fontData = await readFile(join(process.cwd(), 'src/app/inter-700.ttf'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#080a10',
          backgroundImage:
            'radial-gradient(900px 620px at 82% -12%, rgba(56,189,248,0.28), transparent 60%), radial-gradient(760px 560px at -8% 110%, rgba(14,165,233,0.18), transparent 62%)',
          padding: '80px 96px',
          fontFamily: 'Inter',
        }}
      >
        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              backgroundColor: '#38BDF8',
              color: '#06121c',
              fontSize: '40px',
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '60px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#F4F7FC',
            }}
          >
            Mil
            <span style={{ color: '#38BDF8' }}>Web</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            marginTop: '48px',
            fontSize: '68px',
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#F4F7FC',
            maxWidth: '1000px',
          }}
        >
          Transformo ideias em produtos digitais que geram resultado.
        </div>

        {/* Subtext */}
        <div
          style={{
            display: 'flex',
            marginTop: '32px',
            fontSize: '30px',
            color: '#ADB6C7',
          }}
        >
          Sites, sistemas e SaaS sob medida
        </div>

        {/* Tech line */}
        <div
          style={{
            display: 'flex',
            marginTop: '20px',
            fontSize: '26px',
            fontWeight: 600,
            color: '#7DD3FC',
          }}
        >
          Next.js · React · TypeScript · SaaS · Landing Pages
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Inter', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}

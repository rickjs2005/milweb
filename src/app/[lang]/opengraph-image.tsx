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
          backgroundColor: '#000000',
          backgroundImage:
            'none',
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
              backgroundColor: '#D9D9DE',
              color: '#101014',
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
              color: '#F46A34',
            }}
          >
            Mil
            <span style={{ color: '#D9D9DE' }}>Web</span>
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
            color: '#F46A34',
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
            color: '#CD6942',
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
            color: '#EFEFF4',
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

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { PROJECTS } from '@/lib/content';

// Renderiza sob demanda (cacheado pela Vercel). Pula o prerender no build, que
// dispara o bug do @vercel/og no Windows (fileURLToPath → "Invalid URL").
export const dynamic = 'force-dynamic';
export const alt = 'MilWeb — case do projeto';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = PROJECTS.find((x) => x.slug === slug);
  const title = p?.title ?? 'MilWeb';
  const tagline = p?.tagline.pt ?? 'Sites, sistemas e SaaS sob medida';

  // Fonte embutida no repo, lida do disco (sem rede em runtime).
  const fontData = await readFile(join(process.cwd(), 'src/app/inter-700.ttf'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#080a10',
          backgroundImage:
            'radial-gradient(900px 620px at 82% -12%, rgba(56,189,248,0.28), transparent 60%), radial-gradient(760px 560px at -8% 110%, rgba(14,165,233,0.18), transparent 62%)',
          padding: '72px 88px',
          fontFamily: 'Inter',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: '#38BDF8',
              color: '#06121c',
              fontSize: '32px',
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ display: 'flex', fontSize: '34px', fontWeight: 800, color: '#F4F7FC' }}>
            MilWeb
          </div>
        </div>

        {/* Title + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '88px',
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#F4F7FC',
              maxWidth: '1000px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: '24px',
              fontSize: '32px',
              color: '#7DD3FC',
              maxWidth: '980px',
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Footer line */}
        <div style={{ display: 'flex', fontSize: '24px', fontWeight: 600, color: '#ADB6C7' }}>
          Case · MilWeb
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Inter', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}

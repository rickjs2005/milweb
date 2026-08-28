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
          backgroundColor: '#000000',
          backgroundImage:
            'none',
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
              backgroundColor: '#D9D9DE',
              color: '#101014',
              fontSize: '32px',
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ display: 'flex', fontSize: '34px', fontWeight: 800, color: '#F46A34' }}>
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
              color: '#F46A34',
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
              color: '#EFEFF4',
              maxWidth: '980px',
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Footer line */}
        <div style={{ display: 'flex', fontSize: '24px', fontWeight: 600, color: '#CD6942' }}>
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

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollProvider } from "@/components/scroll-provider";
import { TrackConversions } from "@/components/track-conversions";
import { Footer } from "@/components/footer";
import { OsShell } from "@/features/os/os-shell";
import { buildOsPayload } from "@/features/os/payload";
import { THEME_COLOR, THEME_SCRIPT } from "@/features/os/theme";
import { halloweenScript } from "@/features/os/halloween/config";
import { HALLOWEEN_POLICY } from "@/features/os/halloween/policy";
import { InspectProvider } from "@/features/inspect/inspect-provider";
import { MilwebSystemProvider } from "@/features/system/system-provider";
import { ROOT_NODE } from "@/data/milweb-system";
import { getDict, HTML_LANG, LOCALES } from "@/i18n";
import { PROFILE, SITE_URL } from "@/lib/content";
import { localeFrom, type LangParams } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { SITE_COPY, siteJsonLd } from "@/lib/inline-scripts";
import { QUALITY_SCRIPT } from "@/lib/quality";
import { FONT_CLASS } from "@/lib/fonts";
import { PREFERRED_SOURCE_SDK } from "@/lib/preferred-source";


/** As três versões saem prontas do build; o segmento mais externo enumera os idiomas. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * dynamicParams fica no padrão (true) para caminhos desconhecidos chegarem ao
 * catch-all e ao not-found deste idioma; locale inválido é 404 em localeFrom.
 */

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const { title, description } = SITE_COPY[locale];
  const base = pageMetadata({ locale, internalPath: "/", title, description });
  return {
    ...base,
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | MilWeb` },
    applicationName: "MilWeb",
    authors: [{ name: "Rick Januario", url: PROFILE.github }],
    creator: "MilWeb",
    keywords: ["creative development studio", "creative developer", "WebGL", "Next.js", "GSAP", "digital experiences", "criação de sites", "desenvolvimento web", "desarrollo web", "MilWeb"],
    verification: { google: "2CbbaRNR_vN6f0XIjYuMmTu9UpHcKuleYfJtOjWyNmE" },
    // Sem index/follow explícitos: o padrão já é indexável e assim o 404 (status
    // vindo do middleware) fica só com o noindex que o Next injeta.
    robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  };
}

/**
 * Moldura do navegador na cor do papel de parede do MilWeb OS (gelo do Gojo / carvão do Obito —
 * os mesmos valores de styles/os.css › --os-bg; o shell reescreve o `content` quando o tema muda);
 * `cover` para a dock respeitar as áreas seguras do telefone.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.gojo },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.obito },
  ],
  colorScheme: "light",
  viewportFit: "cover",
};

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const d = getDict(locale);
  return (
    <html lang={HTML_LANG[locale]} className={FONT_CLASS} suppressHydrationWarning>
      <body>
    {/* Tema do MilWeb OS antes de qualquer pintura (preferência salva ou o tema do sistema) — sem flash do tema errado. */}
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
    {/* Edição de Halloween (features/os/halloween): marca o <html> antes da pintura se o instante atual cair na janela — decidido no navegador, não no build. */}
    <script dangerouslySetInnerHTML={{ __html: halloweenScript(HALLOWEEN_POLICY) }} />
    <ScrollProvider>
      <InspectProvider strings={{ title: d.inspect.title, dev: d.inspect.dev }}>
      <MilwebSystemProvider root={{ id: ROOT_NODE.id, index: ROOT_NODE.index, key: ROOT_NODE.key, title: ROOT_NODE.title[locale], readout: ROOT_NODE.readout?.[locale] ?? null }}>
        <script dangerouslySetInnerHTML={{ __html: QUALITY_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd(locale) }} />
        <TrackConversions />
        {/* Google Preferred Sources: o SDK oficial UMA vez por página, depois do load, em modo
            manual — quem desenha o botão é a MilWeb (components/google-preferred-source) */}
        <Script src={PREFERRED_SOURCE_SDK} strategy="lazyOnload" {...{ "preferred-sources-control": "manual" }} />
        {/* MilWeb OS: área de trabalho (desktop) / tela inicial (celular) / modo simples.
            Navegação, HUD e transições de rota clássicas vivem dentro do shell, só nas
            rotas que ficam fora do OS (protótipos do Lab, erros) e no modo simples. */}
        <OsShell locale={locale} payload={buildOsPayload(locale)} footer={<Footer locale={locale} />}>
          {children}
        </OsShell>
        <Analytics />
        <SpeedInsights />
      </MilwebSystemProvider>
      </InspectProvider>
    </ScrollProvider>
      </body>
    </html>
  );
}

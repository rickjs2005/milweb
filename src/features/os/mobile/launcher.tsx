"use client";

import { APPS, MOBILE_GRID } from "../registry";
import { useOs, useOsStore } from "../os-shell";
import { useClock, useLaunch } from "../launch";
import { LaunchIcon } from "./icons";

/**
 * Tela inicial do telefone — um launcher, não uma landing comprimida.
 *
 * Só três coisas: a linha de status (marca e hora), o palco (`.os-stage`,
 * irmão no DOM; o CSS o coloca entre a linha de status e a grade — é ali que
 * a lua/o portal do fundo aparecem) e a grade de aplicativos com ícone + nome curto. Nada de
 * lema visível, descrição ou botões — o h1 da raiz continua no DOM, só que
 * invisível. As redes e o WhatsApp moram na dock (mobile/dock.tsx).
 *
 * `display: contents` no celular: os filhos entram direto na coluna da área
 * de trabalho, para o palco ficar entre o status e a grade sem mexer na ordem
 * do DOM que o desktop usa. Fora do celular o launcher inteiro é
 * `display: none` (styles/os-mobile.css); o desktop nunca o vê.
 */
export function MobileLauncher() {
  const { payload, openSearch } = useOs();
  const s = payload.s;
  const launch = useLaunch();
  const time = useClock(payload.locale);
  const dim = useOsStore((st) => (st.focused ? "1" : "0"));

  return (
    <div className="os-launcher">
      <div className="os-launcher__status t-mono" data-dim={dim} data-no-inspect>
        <span className="os-launcher__brand">{payload.brand.mark}</span>
        <time className="os-launcher__time tnum" aria-label={s.time}>
          {time ?? "--:--"}
        </time>
      </div>

      <nav className="os-launcher__apps" aria-label={s.regions.appGrid} data-dim={dim}>
        <ul>
          {MOBILE_GRID.map((id) => (
            <li key={id}>
              <a id={`os-launch-${id}`} href={APPS[id].route ? payload.hrefs[id as keyof typeof payload.hrefs] ?? "#" : "#"} className="os-launch" onClick={(e) => launch(e, id)} data-no-inspect>
                <LaunchIcon app={id} />
                <span className="os-launch__label">{s.apps[id]}</span>
              </a>
            </li>
          ))}
          <li>
            <button type="button" id="os-launch-search" className="os-launch" onClick={openSearch} aria-keyshortcuts="/" data-no-inspect>
              <LaunchIcon app="search" />
              <span className="os-launch__label">{s.apps.search}</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

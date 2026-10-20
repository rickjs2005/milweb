"use client";

import { alternatesOf } from "@/i18n/routing";
import { LanguageSwitch } from "@/components/nav/language-switch";
import { SoundToggle } from "@/features/sound/sound-toggle";
import { useOs, useOsStore } from "../os-shell";

/** Ajustes — só preferências que mudam a experiência: tema, movimento, modo, som, idioma. */
export function SettingsApp() {
  const { payload, store, internal } = useOs();
  const s = payload.s.settings;
  const prefs = useOsStore((st) => st.prefs);
  const set = store.getState().setPrefs;

  const Option = ({ group, value, current, label, onPick, themed }: { group: string; value: string; current: string; label: string; onPick: () => void; themed?: boolean }) => (
    <button type="button" role="radio" aria-checked={current === value} className="os-chip t-mono" name={group} onClick={onPick} data-theme-toggle={themed ? "" : undefined}>
      {label}
    </button>
  );

  return (
    <div className="os-settings">
      {/* Tema: o mesmo store do sol/lua da dock — pedir ao store fecha o olho, troca no escuro e reabre. */}
      <section className="os-settings__row" role="radiogroup" aria-labelledby="os-set-theme">
        <h3 id="os-set-theme" className="t-mono os-app__label">
          {s.theme.toUpperCase()}
        </h3>
        <div className="os-settings__options">
          <Option group="theme" value="gojo" current={prefs.theme} label={s.gojo} onPick={() => store.getState().requestTheme("gojo")} themed />
          <Option group="theme" value="obito" current={prefs.theme} label={s.obito} onPick={() => store.getState().requestTheme("obito")} themed />
        </div>
      </section>

      <section className="os-settings__row" role="radiogroup" aria-labelledby="os-set-motion">
        <h3 id="os-set-motion" className="t-mono os-app__label">
          {s.motion.toUpperCase()}
        </h3>
        <div className="os-settings__options">
          <Option group="motion" value="system" current={prefs.motion} label={s.motionSystem} onPick={() => set({ motion: "system" })} />
          <Option group="motion" value="reduce" current={prefs.motion} label={s.motionReduce} onPick={() => set({ motion: "reduce" })} />
        </div>
      </section>

      <section className="os-settings__row" role="radiogroup" aria-labelledby="os-set-mode">
        <h3 id="os-set-mode" className="t-mono os-app__label">
          {s.mode.toUpperCase()}
        </h3>
        <div className="os-settings__options">
          <Option group="mode" value="os" current={prefs.simple ? "simple" : "os"} label={s.modeOs} onPick={() => set({ simple: false })} />
          <Option group="mode" value="simple" current={prefs.simple ? "simple" : "os"} label={s.modeSimple} onPick={() => set({ simple: true })} />
        </div>
      </section>

      <section className="os-settings__row" aria-labelledby="os-set-sound">
        <h3 id="os-set-sound" className="t-mono os-app__label">
          {s.sound.toUpperCase()}
        </h3>
        <div className="os-settings__options">
          <SoundToggle label={payload.nav.sound.label} on={payload.nav.sound.on} off={payload.nav.sound.off} className="text-ink" />
        </div>
      </section>

      <section className="os-settings__row" aria-labelledby="os-set-lang">
        <h3 id="os-set-lang" className="t-mono os-app__label">
          {s.language.toUpperCase()}
        </h3>
        <div className="os-settings__options">
          <LanguageSwitch current={payload.locale} hrefs={alternatesOf(internal)} label={payload.nav.selectLanguage} names={payload.nav.langNames} className="text-ink" />
        </div>
      </section>

      <section className="os-settings__row">
        <button type="button" className="os-chip t-mono" onClick={() => store.getState().resetLayout()}>
          {s.reset}
        </button>
      </section>

      <p className="os-settings__about">{s.about}</p>
      <p className="t-mono os-settings__saved">{s.saved}</p>
    </div>
  );
}

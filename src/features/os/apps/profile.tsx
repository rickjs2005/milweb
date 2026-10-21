"use client";

import Image from "next/image";
import { flushSync } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { localizePath } from "@/i18n/routing";
import { useOs } from "../os-shell";
import { useLaunch } from "../launch";
import type { OsPayload, OsProfile } from "../types";
import { animateHeight, noMotion, useEntrance, useReading } from "./profile-motion";

/**
 * Perfil — Rick Januario como engenheiro de software, para recrutadores,
 * empresas de tecnologia e agências. Tudo vem da carga do OS
 * (`payload.profile`, montada de data/profile.ts).
 *
 * Leitura: apresentação (foto, nome, cargo, resumo curto com "ler mais" e
 * ações) → navegação interna → Engenharia em prática (três recortes em abas,
 * cada um com a captura real, problema, contribuição, decisão técnica, stack,
 * links e detalhes sob demanda; os demais projetos numa lista compacta) →
 * experiência (linha do tempo com fio, marcadores e o cargo em leitura) →
 * competências → formação. Movimento em apps/profile-motion.ts: entrada uma
 * vez por abertura, altura animada dos acordeões e do resumo, tudo desligado
 * com movimento reduzido. Nada é inventado: textos e links vêm das fontes
 * declaradas em data/profile.ts.
 */
type Strings = OsPayload["s"]["profile"];
type Project = OsProfile["projects"][number];
type Track = OsProfile["showcase"][number];

const SECTIONS = ["intro", "projects", "experience", "skills", "education"] as const;
type SectionKey = (typeof SECTIONS)[number];
const sectionId = (k: SectionKey) => `os-profile-sec-${k}`;

export function ProfileApp() {
  const { payload } = useOs();
  const s = payload.s.profile;
  const p = payload.profile;
  const launch = useLaunch();
  const rootRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const period = (start: string | null, end: string | null) => (start ? `${start} – ${end ?? s.present}` : s.noDates);
  const sectionTitle: Record<SectionKey, string> = { intro: s.intro, projects: s.projectsShort, experience: s.experience, skills: s.skills, education: s.education };

  // entrada: foto e nome → cargo e resumo → ações e navegação (uma vez por abertura)
  useEntrance(rootRef);

  // leitura: seção ativa na navegação e cargo em leitura na linha do tempo (rolagem do corpo da janela)
  const [section, setSection] = useState<SectionKey>("intro");
  const [role, setRole] = useState(0);
  const onFrame = useCallback((viewH: number, scroller: HTMLElement | null) => {
    const root = rootRef.current;
    if (!root) return;
    const base = scroller ? scroller.getBoundingClientRect().top : 0;
    const line = viewH * 0.34;
    let sec: SectionKey = "intro";
    for (const k of SECTIONS) {
      const el = root.querySelector(`#${sectionId(k)}`);
      if (el && el.getBoundingClientRect().top - base <= line) sec = k;
    }
    const atEnd = scroller ? scroller.scrollTop + viewH >= scroller.scrollHeight - 2 : window.scrollY + viewH >= document.documentElement.scrollHeight - 2;
    setSection(atEnd ? "education" : sec);
    let best = 0;
    let bestD = Infinity;
    root.querySelectorAll<HTMLElement>(".os-profile__role").forEach((r, i) => {
      const b = r.getBoundingClientRect();
      const y = b.top - base;
      const d = y <= line && y + b.height >= line ? 0 : Math.min(Math.abs(y - line), Math.abs(y + b.height - line));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setRole(best);
  }, []);
  useReading(rootRef, onFrame);

  const goTo = (e: MouseEvent<HTMLAnchorElement>, k: SectionKey) => {
    const root = rootRef.current;
    const target = root?.querySelector<HTMLElement>(`#${sectionId(k)}`);
    if (!root || !target) return;
    e.preventDefault();
    const scroller = root.closest<HTMLElement>("[data-os-scroller]");
    const nav = navRef.current;
    const navH = nav && getComputedStyle(nav).position === "sticky" ? nav.offsetHeight : 0;
    const behavior: ScrollBehavior = noMotion() ? "auto" : "smooth";
    if (scroller) scroller.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - navH - 8), behavior });
    else window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - navH - 8), behavior });
    target.focus({ preventScroll: true });
  };

  // sobre: três linhas à vista; o texto inteiro está sempre no HTML e a altura anima entre os dois estados
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef<HTMLParagraphElement>(null);
  const toggleAbout = () => {
    const el = aboutRef.current;
    if (!el) return;
    const h0 = el.getBoundingClientRect().height;
    if (!aboutOpen) {
      flushSync(() => setAboutOpen(true));
      animateHeight(el, h0, el.getBoundingClientRect().height);
    } else {
      el.setAttribute("data-collapsed", "1");
      const h1 = el.getBoundingClientRect().height;
      el.setAttribute("data-collapsed", "0");
      if (!animateHeight(el, h0, h1, () => flushSync(() => setAboutOpen(false)))) setAboutOpen(false);
    }
  };

  // engenharia em prática: abas com indicador deslizante, setas/Home/End, painéis empilhados
  const tracks = p.showcase;
  const uid = useId();
  const [track, setTrack] = useState<Track["key"]>(tracks[0]?.key ?? "backend");
  const tablistRef = useRef<HTMLDivElement>(null);
  const placeInk = useCallback(() => {
    const list = tablistRef.current;
    const btn = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!list || !btn) return;
    list.style.setProperty("--ink-x", `${btn.offsetLeft}px`);
    list.style.setProperty("--ink-y", `${btn.offsetTop + btn.offsetHeight}px`);
    list.style.setProperty("--ink-w", `${btn.offsetWidth}px`);
  }, []);
  useLayoutEffect(placeInk, [placeInk, track]);
  useEffect(() => {
    const list = tablistRef.current;
    if (!list) return;
    const ro = new ResizeObserver(placeInk);
    ro.observe(list);
    return () => ro.disconnect();
  }, [placeInk]);
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = tracks.map((t) => t.key);
    const i = keys.indexOf(track);
    let n = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % keys.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + keys.length) % keys.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = keys.length - 1;
    else return;
    e.preventDefault();
    setTrack(keys[n]);
    tablistRef.current?.querySelector<HTMLElement>(`[data-track="${keys[n]}"]`)?.focus();
  };
  const projectOf = (slug: string) => p.projects.find((x) => x.slug === slug) ?? null;
  const rest = p.projects.filter((pr) => !tracks.some((t) => t.project === pr.slug));

  // trechos repetidos (funções, não componentes: a identidade não muda a cada re-render da leitura)
  const links = (pr: Project) => (
    <p className="os-profile__plinks t-mono">
      {pr.code.map((c) => (
        <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" className="link-rule">
          {s.code.toUpperCase()}
          {pr.code.length > 1 ? ` · ${c.label.toUpperCase()}` : ""}
          <span className="os-arrow" aria-hidden="true">↗</span>
          <span className="sr-only"> · {s.opensNewTab}</span>
        </a>
      ))}
      {pr.demo && (
        <a href={pr.demo} target="_blank" rel="noopener noreferrer" className="link-rule">
          {s.demo.toUpperCase()}
          <span className="os-arrow" aria-hidden="true">↗</span>
          <span className="sr-only"> · {s.opensNewTab}</span>
        </a>
      )}
      {pr.caseRoute && (
        <a href={localizePath(payload.locale, pr.caseRoute)} className="link-rule" onClick={(e) => launch(e, "projects", pr.caseRoute!)}>
          {s.caseLink.toUpperCase()}
          <span className="os-arrow" aria-hidden="true">→</span>
        </a>
      )}
      {!pr.demo && <span className="os-profile__nodemo">{s.noDemo}</span>}
    </p>
  );
  const nameLine = (pr: Project) => (
    <p className="os-profile__pname">
      {pr.name}
      <span className="os-profile__status" data-status={pr.status}>
        {s.status[pr.status]}
      </span>
    </p>
  );
  const evidence = (pr: Project) => (
    <>
      <div>
        <dt>{s.evidenceCode}</dt>
        <dd>{pr.evidence.code}</dd>
      </div>
      <div>
        <dt>{s.evidenceReadme}</dt>
        <dd>{pr.evidence.readme}</dd>
      </div>
    </>
  );

  return (
    <article ref={rootRef} className="os-profile" aria-label={s.eyebrow}>
      <header id={sectionId("intro")} className="os-profile__hero" tabIndex={-1}>
        <Image src={p.photo.src} alt={p.photo.alt} width={160} height={160} sizes="128px" className="os-profile__photo" priority data-enter="1" />
        <div className="os-profile__who">
          <p className="t-mono os-app__eyebrow" data-enter="1">
            {s.eyebrow.toUpperCase()}
          </p>
          <p className="os-profile__name t-display" data-enter="1">
            {p.name}
          </p>
          <p className="os-profile__title" data-enter="2">
            {p.title}
          </p>
          <p className="os-profile__headline" data-enter="2">
            {p.headline}
          </p>
          <p className="t-mono os-profile__meta" data-enter="2">
            <span>{p.studio}</span>
            <span aria-hidden="true"> · </span>
            <span>{p.location}</span>
          </p>
        </div>
        <div className="os-profile__actions">
          <a className="os-cta" href={p.cv.href} target="_blank" rel="noopener noreferrer" data-profile-action="view-cv" data-enter="3">
            {s.viewCv.toUpperCase()}
            <span className="os-arrow" aria-hidden="true">↗</span>
            <span className="sr-only"> · {p.cv.lang} · {s.opensNewTab}</span>
          </a>
          <a className="os-chip t-mono" href={p.cv.href} download={p.cv.download} data-profile-action="download-cv" data-enter="3">
            {s.downloadCv.toUpperCase()}
            <span className="os-arrow" data-dir="down" aria-hidden="true">↓</span>
            <span className="sr-only"> · {p.cv.lang}</span>
          </a>
          <a className="os-chip t-mono" href={p.links.github} target="_blank" rel="noopener noreferrer" data-profile-action="github" data-enter="3">
            GITHUB<span className="os-arrow" aria-hidden="true">↗</span>
            <span className="sr-only"> · {s.opensNewTab}</span>
          </a>
          <a className="os-chip t-mono" href={p.links.linkedin} target="_blank" rel="noopener noreferrer" data-profile-action="linkedin" data-enter="3">
            LINKEDIN<span className="os-arrow" aria-hidden="true">↗</span>
            <span className="sr-only"> · {s.opensNewTab}</span>
          </a>
          <a className="os-chip t-mono" href={payload.hrefs.contact} onClick={(e) => launch(e, "contact")} data-profile-action="contact" data-enter="3">
            {s.contact.toUpperCase()}
            <span className="os-arrow" aria-hidden="true">→</span>
          </a>
          <p className="t-mono os-profile__cvnote" data-enter="3">
            {p.cv.lang}
          </p>
        </div>
      </header>

      <nav ref={navRef} className="os-profile__nav t-mono" aria-label={s.sections} data-enter="3">
        {SECTIONS.map((k) => (
          <a key={k} href={`#${sectionId(k)}`} data-section={k} data-active={section === k ? "1" : "0"} aria-current={section === k ? "location" : undefined} onClick={(e) => goTo(e, k)}>
            {sectionTitle[k].toUpperCase()}
          </a>
        ))}
      </nav>

      <section className="os-app__section" aria-labelledby="os-profile-about">
        <h3 id="os-profile-about" className="t-mono os-app__label">
          {s.about.toUpperCase()}
        </h3>
        <p ref={aboutRef} id={`${uid}-about`} className="os-app__lead os-profile__about" data-collapsed={aboutOpen ? "0" : "1"}>
          {p.about}
        </p>
        <button type="button" className="os-profile__morebtn t-mono" aria-expanded={aboutOpen} aria-controls={`${uid}-about`} onClick={toggleAbout}>
          {(aboutOpen ? s.readLess : s.readMore).toUpperCase()}
          <span className="os-arrow" data-dir={aboutOpen ? "up" : "down"} aria-hidden="true">
            {aboutOpen ? "↑" : "↓"}
          </span>
        </button>
      </section>

      <section id={sectionId("projects")} className="os-app__section" aria-labelledby="os-profile-showcase" tabIndex={-1}>
        <h3 id="os-profile-showcase" className="t-mono os-app__label">
          {s.showcase.toUpperCase()}
        </h3>
        <div className="os-showcase">
          <div ref={tablistRef} className="os-tabs" role="tablist" aria-label={s.tracks} onKeyDown={onTabKey}>
            {tracks.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`${uid}-tab-${t.key}`}
                className="os-tabs__tab t-mono"
                data-track={t.key}
                aria-selected={track === t.key}
                aria-controls={`${uid}-panel-${t.key}`}
                tabIndex={track === t.key ? 0 : -1}
                onClick={() => setTrack(t.key)}
              >
                {t.label}
              </button>
            ))}
            <span className="os-tabs__ink" aria-hidden="true" />
          </div>
          <div className="os-showcase__panels">
            {tracks.map((t) => {
              const pr = projectOf(t.project);
              if (!pr) return null;
              const on = track === t.key;
              return (
                <div key={t.key} role="tabpanel" id={`${uid}-panel-${t.key}`} aria-labelledby={`${uid}-tab-${t.key}`} className="os-showcase__panel" data-active={on ? "1" : "0"} data-project={pr.slug} inert={!on} aria-hidden={!on}>
                  <Preview project={pr} s={s} />
                  <div className="os-showcase__text">
                    <p className="t-mono os-profile__pkind">{pr.kind.toUpperCase()}</p>
                    {nameLine(pr)}
                    <dl className="os-profile__facts">
                      <div>
                        <dt>{s.problem}</dt>
                        <dd>{pr.problem}</dd>
                      </div>
                      <div>
                        <dt>{s.contribution}</dt>
                        <dd>{t.contribution}</dd>
                      </div>
                      <div>
                        <dt>{s.decision}</dt>
                        <dd>{t.decision}</dd>
                      </div>
                      <div>
                        <dt>{s.stack}</dt>
                        <dd>{t.stack.join(" · ")}</dd>
                      </div>
                    </dl>
                    {links(pr)}
                    <Details summary={s.details.toUpperCase()}>
                      <dl>{evidence(pr)}</dl>
                    </Details>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {rest.length > 0 && (
          <div className="os-profile__more">
            <h4 className="t-mono os-profile__gtitle">{s.more.toUpperCase()}</h4>
            <ul className="os-profile__morelist">
              {rest.map((pr) => (
                <li key={pr.slug} className="os-profile__mini" data-project={pr.slug}>
                  <div className="os-showcase__shot" data-kind="still">
                    <Image src={pr.image} alt={pr.imageAlt} fill sizes="(max-width: 719px) 220px, 132px" className="os-profile__shot-img" />
                  </div>
                  <div className="os-profile__minibody">
                    <p className="t-mono os-profile__pkind">{pr.kind.toUpperCase()}</p>
                    {nameLine(pr)}
                    <p className="os-profile__miniproblem">{pr.problem}</p>
                    {links(pr)}
                    <Details summary={s.details.toUpperCase()}>
                      <dl>
                        <div>
                          <dt>{s.contribution}</dt>
                          <dd>{pr.contribution}</dd>
                        </div>
                        <div>
                          <dt>{s.decision}</dt>
                          <dd>{pr.decision}</dd>
                        </div>
                        <div>
                          <dt>{s.stack}</dt>
                          <dd>{pr.stack.join(" · ")}</dd>
                        </div>
                        {evidence(pr)}
                      </dl>
                    </Details>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section id={sectionId("experience")} className="os-app__section" aria-labelledby="os-profile-experience" tabIndex={-1}>
        <h3 id="os-profile-experience" className="t-mono os-app__label">
          {s.experience.toUpperCase()}
        </h3>
        <ol className="os-profile__timeline">
          {p.experience.map((r, i) => (
            <li key={r.company} className="os-profile__role" data-independent={r.independent ? "1" : undefined} data-active={role === i ? "1" : "0"}>
              <div className="os-profile__when t-mono">
                <span className="tnum">{period(r.start, r.end)}</span>
                <span>
                  {r.location}
                  {r.remote ? ` · ${s.remote}` : ""}
                </span>
                {r.independent && <span className="os-profile__tag">{s.independent}</span>}
              </div>
              <div className="os-profile__what">
                <p className="os-profile__company">
                  {r.company}
                  <span className="os-profile__roletitle">{r.title}</span>
                </p>
                <ul>
                  {r.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id={sectionId("skills")} className="os-app__section" aria-labelledby="os-profile-skills" tabIndex={-1}>
        <h3 id="os-profile-skills" className="t-mono os-app__label">
          {s.skills.toUpperCase()}
        </h3>
        <div className="os-profile__skills">
          {p.skills.map((g) => (
            <div key={g.key} className="os-profile__group">
              <h4 className="t-mono os-profile__gtitle">{g.title.toUpperCase()}</h4>
              <ul className="os-profile__chips">
                {g.items.map((i) => (
                  <li key={i.name} data-featured={i.featured ? "1" : "0"}>
                    {i.name}
                    {i.note && <span className="os-profile__note"> · {i.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id={sectionId("education")} className="os-app__section" aria-labelledby="os-profile-education" tabIndex={-1}>
        <h3 id="os-profile-education" className="t-mono os-app__label">
          {s.education.toUpperCase()}
        </h3>
        <ul className="os-profile__edu">
          {p.education.map((e) => (
            <li key={e.degree}>
              <span className="t-mono tnum os-profile__eduwhen">
                {e.start} – {e.end}
              </span>
              <span className="os-profile__degree">{e.degree}</span>
              <span className="os-profile__school">{e.school}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="os-app__footer t-mono">
        <a href={payload.hrefs.studio} className="link-rule" onClick={(e) => launch(e, "studio")}>
          {s.studioLink.toUpperCase()}
          <span className="os-arrow" aria-hidden="true">→</span>
        </a>
        <a href={payload.hrefs.projects} className="link-rule" onClick={(e) => launch(e, "projects")}>
          {s.projectsLink.toUpperCase()}
          <span className="os-arrow" aria-hidden="true">→</span>
        </a>
        <a href={payload.hrefs.contact} className="link-rule" onClick={(e) => launch(e, "contact")}>
          {s.contact.toUpperCase()}
          <span className="os-arrow" aria-hidden="true">→</span>
        </a>
      </footer>
    </article>
  );
}

/**
 * Acordeão com abertura suave: o corpo anima a altura (WAAPI) e o foco continua no summary.
 * O conteúdo está sempre no HTML (leitores e busca); com movimento reduzido é o toggle nativo.
 */
function Details({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onClick = (e: MouseEvent<HTMLElement>) => {
    const d = ref.current;
    const b = bodyRef.current;
    if (!d || !b) return;
    e.preventDefault();
    if (noMotion()) {
      d.open = !d.open;
      return;
    }
    if (!d.open) {
      d.open = true;
      const h = b.getBoundingClientRect().height;
      if (animateHeight(b, 0, h)) b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
    } else {
      const h = b.getBoundingClientRect().height;
      const closing = animateHeight(b, h, 0, () => {
        d.open = false;
      });
      if (!closing) d.open = false;
    }
  };
  return (
    <details ref={ref} className="os-profile__details">
      <summary className="t-mono" onClick={onClick}>
        {summary}
      </summary>
      <div ref={bodyRef} className="os-profile__dbody">
        {children}
      </div>
    </details>
  );
}

/** Só uma demonstração toca por vez, em qualquer painel. */
let playingNow: { id: object; stop: () => void } | null = null;

/**
 * Prévia do projeto: a captura real (public/shots). Quando o projeto tiver um vídeo real
 * (`video.src`), ele toca mudo no hover de ponteiro fino, para e volta à capa ao sair, e nos
 * aparelhos sem hover (ou por teclado) o botão "Ver demonstração" faz o mesmo, com pausar e fechar.
 * A mídia só é pedida no primeiro play (preload none); a capa e a proporção 16:10 ficam fixas.
 */
function Preview({ project, s }: { project: Project; s: Strings }) {
  const v = project.video;
  const videoRef = useRef<HTMLVideoElement>(null);
  const token = useRef<object>({});
  // Fechar ou pausar pelos controles com o mouse em cima não pode religar pelo hover: o Chrome reenvia
  // pointerenter quando o elemento sob o cursor muda. A trava cai quando o ponteiro sai do quadro.
  const hoverLock = useRef(false);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const stop = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    if (playingNow?.id === token.current) playingNow = null;
    setState("idle");
  }, []);
  const play = useCallback(() => {
    const el = videoRef.current;
    if (!el || !v) return;
    if (playingNow && playingNow.id !== token.current) playingNow.stop();
    if (!el.getAttribute("src")) {
      el.src = v.src;
      el.load();
    }
    el.play()
      .then(() => {
        playingNow = { id: token.current, stop };
        setState("playing");
      })
      .catch(() => setState("idle"));
  }, [v, stop]);
  const pause = useCallback(() => {
    videoRef.current?.pause();
    setState("paused");
  }, []);
  useEffect(() => {
    const id = token.current;
    return () => {
      if (playingNow?.id === id) playingNow = null;
    };
  }, []);
  const fine = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  return (
    <figure className="os-showcase__figure">
      <div
        className="os-showcase__shot"
        data-kind={v ? "video" : "still"}
        data-playing={v ? state : undefined}
        onPointerEnter={
          v
            ? (e) => {
                if (e.pointerType === "mouse" && fine() && state === "idle" && !hoverLock.current) play();
              }
            : undefined
        }
        onPointerLeave={
          v
            ? (e) => {
                hoverLock.current = false;
                if (e.pointerType === "mouse" && state === "playing") stop();
              }
            : undefined
        }
      >
        <Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 719px) 100vw, 360px" className="os-profile__shot-img" />
        {v && (
          <>
            <video ref={videoRef} className="os-showcase__video" muted playsInline loop preload="none" poster={v.poster ?? undefined} aria-label={`${s.demo} · ${project.name}`} tabIndex={-1} />
            <div className="os-showcase__vctl">
              <button
                type="button"
                className="os-chip t-mono"
                aria-pressed={state === "playing"}
                onClick={() => {
                  if (state === "playing") {
                    hoverLock.current = true;
                    pause();
                  } else play();
                }}
              >
                {(state === "playing" ? s.pauseDemo : s.playDemo).toUpperCase()}
              </button>
              <button
                type="button"
                className="os-chip t-mono"
                hidden={state === "idle"}
                onClick={() => {
                  hoverLock.current = true;
                  stop();
                }}
                aria-label={s.closeDemo}
              >
                ×
              </button>
            </div>
          </>
        )}
      </div>
      <figcaption className="t-mono os-showcase__cap">{s.realCapture}</figcaption>
    </figure>
  );
}

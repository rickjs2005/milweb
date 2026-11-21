"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { DivePoster } from "../apps/idea/dive";
import { PracticePoster } from "../apps/idea/practice";
import { projectsIntent } from "../apps/bounty/intent";
import { useLaunch } from "../launch";
import { pushOverlay } from "../mobile/history";
import { useOs, useOsStore } from "../os-shell";
import { APPS, DESKTOP_WIDE_MQ, isAppId } from "../registry";
import type { OsProject } from "../types";
import { respond } from "./brain";
import { arrive, guide, stage, useGuide, type GuideAction, type GuideMessage } from "./guide-store";
import { writeBrief } from "./handoff";
import { idea, useIdea } from "./idea-store";
import { canListen, canSpeak, hush, listen, speak, type Listener } from "./voice";

/**
 * A conversa com a Matéria.
 *
 *   MateriaControls  na primeira tela: os dois destinos em destaque ("Ver projetos" e "Perfil e
 *                    currículo") onde a grade de aplicativos não os mostra como botões, a entrada
 *                    discreta "Conversar com a Matéria", e o recorte no rosto (MateriaPortal), onde a
 *                    ideia aparece e de onde cresce até virar janela.
 *   MateriaGuide     o painel (texto e microfone desde o primeiro momento) e a pílula que mantém a
 *                    conversa enquanto o visitante navega.
 *
 * Um destino pedido na conversa abre pelo MESMO caminho do clique no lançador e da busca
 * (guide-store.ts › arrive): a janela abre na hora, a escultura vira a figura dele e faz o gesto.
 *
 * Tudo funciona sem o motor 3D, sem voz e sem rede: as respostas vêm de materia/brain.ts, e as ações
 * só alcançam o que o portfólio cadastra — apps do OS, projetos do catálogo, o currículo e os
 * repositórios do perfil, a prévia (apps/idea) e o pedido de proposta do Hire Rick. Sem motor ou com
 * movimento reduzido, a prévia abre direto na janela.
 */
const reduced = () => typeof window !== "undefined" && (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.osMotion === "reduce");
let nextId = 1;
const stamp = (m: Omit<GuideMessage, "id">): GuideMessage => ({ ...m, id: Date.now() * 100 + (nextId++ % 100) });

/** Um recorte da tela cresce de `from` até a janela de `app` (medida sem a animação de entrada) e some sobre ela. */
function flyTo(el: HTMLElement, from: { left: number; top: number; width: number; height: number }, app: string, phone: boolean, shape: { from: string; to: string }, done?: () => void) {
  const since = performance.now();
  const aim = () => {
    const win = document.querySelector<HTMLElement>(`.os-window[data-app="${app}"]`);
    const ready = !!win && win.offsetWidth > 40;
    if (!ready && performance.now() - since < 450) return void requestAnimationFrame(aim);
    const layer = win?.offsetParent?.getBoundingClientRect();
    const to = ready && win && !phone ? { left: (layer?.left ?? 0) + win.offsetLeft, top: (layer?.top ?? 0) + win.offsetTop, width: win.offsetWidth, height: win.offsetHeight } : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const box = (r: typeof from) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const anim = el.animate(
      [
        { ...box(from), ...shapeOf(shape.from), opacity: 1, offset: 0 },
        { ...box(to), ...shapeOf(shape.to), opacity: 1, offset: 0.8 },
        { ...box(to), ...shapeOf(shape.to), opacity: 0, offset: 1 },
      ],
      { duration: 820, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" },
    );
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      el.remove();
      done?.();
    };
    anim.onfinish = end;
    anim.oncancel = end;
    window.setTimeout(end, 1400);
  };
  requestAnimationFrame(aim);
}
const shapeOf = (value: string) => (value.startsWith("polygon") ? { clipPath: value } : { borderRadius: value });

function useActions() {
  const { payload, navigate, store } = useOs();
  const catalog = useCallback((slug: string | null) => (slug ? [...payload.projects, ...payload.authorial].find((p) => p.slug === slug) : undefined), [payload]);
  const cvLink = '[data-profile-action="view-cv"]';

  /**
   * A prévia vira uma janela do OS. Vinda do recorte (`from`), a página que se via através do rosto cresce até o
   * retângulo da janela; sem recorte (movimento reduzido, sem 3D), a janela abre direto.
   */
  const openIdea = useCallback(
    (from?: HTMLElement | null) => {
      if (!idea.get().kind) return false;
      const st = store.getState();
      const phone = st.shell === "mobile";
      const rect = from?.getBoundingClientRect();
      const page = from?.querySelector<HTMLElement>(".os-materia-cut__page");
      const fly = rect && page && rect.width > 20 && !reduced() ? document.createElement("div") : null;
      if (fly && rect && page) {
        fly.className = "os-materia-flight";
        fly.appendChild(page.cloneNode(true));
        Object.assign(fly.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
        document.body.appendChild(fly);
        // a janela de verdade espera atrás do recorte que cresce e aparece quando ele chega
        document.documentElement.dataset.osArriving = "idea";
        window.setTimeout(() => delete document.documentElement.dataset.osArriving, 640);
      }
      // A conversa se recolhe na pílula: a janela é para experimentar, e a Matéria continua a um toque.
      // Sem recorte a janela abre junto com a resposta: a pílula avisa que há o que ler.
      guide.set({ portal: null, reflect: null, min: guide.get().open ? true : guide.get().min, unread: guide.get().open && !guide.get().min && !from ? true : guide.get().unread });
      st.open("idea", { source: "user", mode: "push", openedBy: null });
      // App sem URL própria no telefone: uma entrada no histórico, para o Voltar fechá-lo.
      if (phone) pushOverlay("idea");
      if (fly && rect) flyTo(fly, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, "idea", phone, { from: "50%", to: "14px" });
      return true;
    },
    [store],
  );

  /** Mostra a prévia preparada: dentro da escultura quando ela está viva; senão, direto na janela. */
  const presentIdea = useCallback(() => {
    const st = idea.get();
    if (!st.kind) return false;
    if (!stage.ready() || reduced()) return openIdea();
    const os = store.getState();
    // No telefone a figura mora na tela inicial: sai do app aberto. A folha da conversa se recolhe onde cobriria a figura.
    if (os.shell === "mobile" && os.focused) navigate("/", "push", true);
    guide.set({ portal: st.kind, reflect: st.reference, min: window.matchMedia(DESKTOP_WIDE_MQ).matches ? guide.get().min : true });
    return true;
  }, [navigate, openIdea, store]);

  /**
   * Só o que o portfólio cadastra: apps do OS, projetos do catálogo, arquivos e endereços do perfil, a prévia e o
   * pedido de proposta. `focus`: o que recebe o foco quando o destino chega (um seletor dentro da janela).
   */
  const run = useCallback(
    (action: GuideAction, focus?: string): boolean => {
      const phone = store.getState().shell === "mobile";
      const leave = () => guide.set({ min: phone ? true : guide.get().min, reflect: null, portal: null });
      if (action.kind === "app") {
        const route = isAppId(action.app) ? APPS[action.app].route : null;
        if (!route) return false;
        leave();
        navigate(route, "push", true);
        arrive(action.app, focus ?? action.focus);
        return true;
      }
      if (action.kind === "project") {
        const project = catalog(action.slug);
        if (!project) return false;
        guide.set({ portal: null, reflect: project.slug, min: phone ? true : guide.get().min });
        navigate(`/work/${project.slug}`, "push", true);
        arrive("projects");
        return true;
      }
      if (action.kind === "made") {
        if (!catalog(action.slug)) return false;
        leave();
        projectsIntent.set({ slug: action.slug, face: "made" });
        navigate("/work", "push", true);
        arrive("projects");
        return true;
      }
      if (action.kind === "file") {
        const allowed = [payload.profile.cv.href, payload.profile.links.github, payload.profile.links.linkedin, ...payload.profile.projects.flatMap((p) => p.code.map((c) => c.url))];
        if (!allowed.includes(action.href)) return false;
        return !!window.open(action.href, "_blank", "noopener");
      }
      if (action.kind === "idea") return presentIdea();
      if (action.kind === "brief") {
        writeBrief(payload);
        leave();
        navigate("/contact", "push", true);
        arrive("contact");
        return true;
      }
      return false;
    },
    [catalog, navigate, payload, presentIdea, store],
  );
  /** O currículo quando o navegador não deixa abrir a nova aba (pedido por voz): o Perfil, com o link do PDF já em foco. */
  const showCv = useCallback(() => run({ kind: "app", app: "profile", label: "" }, cvLink), [run]);
  return { run, openIdea, showCv, cv: payload.profile.cv.href };
}

/** Enviar uma mensagem: responde, guarda o que aprendeu e roda a ação que a resposta pede. */
function useSend() {
  const { payload, locale, store } = useOs();
  const { run, showCv, cv } = useActions();
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  return useCallback(
    (raw: string, viaVoice = false) => {
      const text = raw.trim();
      if (!text) return;
      hush();
      const g = guide.get();
      const route = store.getState().wins.projects.open && store.getState().focused === "projects" ? store.getState().wins.projects.route : null;
      const here = { project: route?.startsWith("/work/") ? route.slice(6) : null, live: stage.ready() && !reduced() };
      const reply = respond(text, g.ctx, payload, here);
      guide.set({ messages: [...g.messages, stamp({ from: "you", text })], phase: "thinking", interim: "", ctx: reply.ctx, portal: null });
      if (reply.idea) idea.prepare(reply.idea.kind, reply.ctx.project, reply.idea.priority);
      // Arquivos abrem dentro do gesto de quem escreveu (senão o navegador bloqueia a nova aba); por voz, fica o botão.
      const opened = reply.run?.kind === "file" && !viaVoice ? run(reply.run) : false;
      const quick = reduced();
      timers.current.push(
        window.setTimeout(() => {
          const voiced = viaVoice && canSpeak();
          guide.set((s) => ({ messages: [...s.messages, stamp({ from: "materia", text: reply.text, actions: reply.actions, card: reply.card })], phase: "speaking", unread: s.min }));
          const settle = () => guide.set((s) => (s.phase === "speaking" ? { phase: "idle" } : {}));
          if (voiced) speak(reply.text, locale, settle);
          else timers.current.push(window.setTimeout(settle, quick ? 0 : Math.min(4200, 900 + reply.text.length * 22)));
          // A prévia aparece depois da resposta: a pessoa lê o que vai ver e então a escultura se abre.
          const next: GuideAction | undefined = reply.idea ? { kind: "idea", label: "" } : reply.run;
          if (next && !opened && next.kind !== "file") timers.current.push(window.setTimeout(() => run(next), quick ? 0 : reply.idea ? 700 : 520));
          // O currículo pedido por voz (ou com a nova aba barrada): o documento fica a um Enter — o Perfil abre com o link do PDF em foco.
          else if (next && !opened && next.kind === "file" && next.href === cv) timers.current.push(window.setTimeout(showCv, quick ? 0 : 520));
        }, quick ? 0 : 420),
      );
    },
    [cv, locale, payload, run, showCv, store],
  );
}

function openGuide(hello: string, starters: GuideAction[]) {
  const g = guide.get();
  guide.set({ open: true, min: false, unread: false, messages: g.messages.length ? g.messages : [stamp({ from: "materia", text: hello, actions: starters })] });
}

/** O recorte no rosto: a ideia aparece ali dentro; tocar nela a faz crescer até virar uma janela do OS. */
function MateriaPortal() {
  const { payload } = useOs();
  const M = payload.materia;
  const portal = useGuide((s) => s.portal);
  const direction = useIdea((s) => s.priority);
  const { openIdea } = useActions();
  const wrap = useRef<HTMLDivElement>(null);
  const cut = useRef<HTMLButtonElement>(null);

  // O motor diz, quadro a quadro, onde o recorte está e quanto abriu; aqui só se escrevem variáveis CSS.
  useEffect(() => {
    if (!portal) return;
    stage.cut = (c) => {
      const el = wrap.current;
      if (!el) return;
      if (!c) {
        el.dataset.open = "0";
        return;
      }
      el.style.setProperty("--cx", `${c.x.toFixed(1)}px`);
      el.style.setProperty("--cy", `${c.y.toFixed(1)}px`);
      el.style.setProperty("--rx", `${c.rx.toFixed(1)}px`);
      el.style.setProperty("--ry", `${c.ry.toFixed(1)}px`);
      el.style.setProperty("--co", c.open.toFixed(3));
      el.dataset.open = c.open > 0.02 ? "1" : "0";
      el.dataset.ready = c.open > 0.92 ? "1" : "0";
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || (e.target as HTMLElement | null)?.closest?.(".os-materia-panel, input, textarea, dialog[open]")) return;
      guide.set({ portal: null, reflect: null });
    };
    document.addEventListener("keydown", onKey);
    return () => {
      stage.cut = null;
      document.removeEventListener("keydown", onKey);
    };
  }, [portal]);

  if (!portal) return null;
  const enter = () => openIdea(cut.current);
  return (
    <div ref={wrap} className="os-materia-portal" data-kind={portal} data-open="0" data-ready="0" data-no-inspect>
      <button ref={cut} type="button" className="os-materia-cut" aria-label={M.ui.portal} onClick={enter}>
        <span className="os-materia-cut__page" aria-hidden="true">
          {portal === "dive" ? <DivePoster data={payload.idea.dive} /> : <PracticePoster data={payload.idea.practice} direction={direction} />}
        </span>
      </button>
      <p className="os-materia-portal__bar">
        <button type="button" className="os-materia-portal__open" onClick={enter}>
          <span className="os-materia-talk__dot" aria-hidden="true" />
          {M.ui.portalOpen}
        </button>
        <button type="button" className="os-materia-portal__close" onClick={() => guide.set({ portal: null, reflect: null })}>
          {M.ui.portalClose}
        </button>
      </p>
    </div>
  );
}

/** As sugestões que abrem a conversa: servem a quem veio ver os sites, o currículo ou pedir um orçamento. */
const startersOf = (say: { chipExplore: string; chipCv: string; chipQuote: string }): GuideAction[] => [say.chipExplore, say.chipCv, say.chipQuote].map((label) => ({ kind: "say", text: label, label }));

/**
 * Na primeira tela: "Ver projetos" e "Perfil e currículo" (no telefone e no tablet; no desktop largo são os dois
 * primeiros itens da navegação, desenhados como botões — styles/os.css), a entrada discreta da conversa e o recorte.
 */
export function MateriaControls() {
  const { payload } = useOs();
  const M = payload.materia;
  const open = useGuide((s) => s.open && !s.min);
  const portal = useGuide((s) => s.portal);
  const launch = useLaunch();
  const start = () => openGuide(M.say.hello, startersOf(M.say));

  return (
    <>
      <div className="os-materia-ui" data-open={open || portal ? "1" : "0"} data-no-inspect>
        <div className="os-materia-cta">
          <a className="os-materia-go" data-app="projects" href={payload.hrefs.projects} onClick={(e) => launch(e, "projects")} onPointerEnter={() => stage.warm?.("projects")} onFocus={() => stage.warm?.("projects")}>
            {M.ui.goProjects}
          </a>
          <a className="os-materia-go" data-app="profile" href={payload.hrefs.profile} onClick={(e) => launch(e, "profile")} onPointerEnter={() => stage.warm?.("profile")} onFocus={() => stage.warm?.("profile")}>
            {M.ui.goProfile}
          </a>
          <button type="button" className="os-materia-talk" onClick={start}>
            <span className="os-materia-talk__dot" aria-hidden="true" />
            {M.ui.talk}
          </button>
        </div>
      </div>
      <MateriaPortal />
    </>
  );
}

function Card({ project, label, onOpen }: { project: OsProject; label: string; onOpen: () => void }) {
  return (
    <button type="button" className="os-materia-card" onClick={onOpen} aria-label={`${label} · ${project.title}`}>
      <span className="os-materia-card__shot">
        <Image src={project.image} alt="" fill sizes="120px" />
      </span>
      <span className="os-materia-card__text">
        <strong>{project.title}</strong>
        <span>{project.status ?? project.tagline}</span>
      </span>
    </button>
  );
}

export function MateriaGuide() {
  const { payload, locale } = useOs();
  const M = payload.materia;
  const open = useGuide((s) => s.open);
  const min = useGuide((s) => s.min);
  const phase = useGuide((s) => s.phase);
  const messages = useGuide((s) => s.messages);
  const interim = useGuide((s) => s.interim);
  const micDenied = useGuide((s) => s.micDenied);
  const unread = useGuide((s) => s.unread);
  const portal = useGuide((s) => s.portal);
  const focused = useOsStore((s) => s.focused);
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState("");
  const [voiceOk, setVoiceOk] = useState(false);
  const send = useSend();
  const { run } = useActions();
  const listener = useRef<Listener | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const catalog = (slug?: string) => (slug ? [...payload.projects, ...payload.authorial].find((p) => p.slug === slug) : undefined);
  const starters = (): GuideAction[] => startersOf(M.say);

  // Depois de hidratar: retoma a conversa e a prévia da aba e descobre se o navegador reconhece voz.
  useEffect(() => {
    guide.restore();
    idea.restore();
    setVoiceOk(canListen());
  }, []);

  // "Ver uma ideia para o meu site" (na área de trabalho ou numa prévia vazia): abre a conversa já com o pedido.
  useEffect(() => {
    stage.ask = (text) => {
      guide.set({ open: true, min: false, unread: false });
      send(text);
    };
    return () => {
      stage.ask = null;
    };
  }, [send]);

  // Com o recorte aberto as janelas saem de cena (styles/materia.css) para a escultura ficar à vista.
  useEffect(() => {
    const h = document.documentElement;
    if (portal) h.dataset.osPortal = portal;
    else delete h.dataset.osPortal;
    return () => {
      delete h.dataset.osPortal;
    };
  }, [portal]);

  const stopListening = useCallback(() => {
    listener.current?.stop();
    listener.current = null;
    guide.set((s) => (s.phase === "listening" ? { phase: "idle", interim: "" } : {}));
  }, []);
  const close = useCallback(() => {
    stopListening();
    hush();
    guide.set({ open: false, min: false, phase: "idle", reflect: null, portal: null, interim: "" });
    // o foco volta para quem abre a conversa
    requestAnimationFrame(() => document.querySelector<HTMLElement>(".os-materia-bubble, .os-materia-talk")?.focus({ preventScroll: true }));
  }, [stopListening]);
  // Encerrar a escuta e a fala ao sair da página ou ao trocar de aba.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        stopListening();
        hush();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      listener.current?.stop();
      hush();
    };
  }, [stopListening]);

  const visible = open && !min;
  useEffect(() => {
    if (!visible) return;
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [visible, messages, interim, phase]);
  useEffect(() => {
    if (!visible) return;
    // No telefone o teclado só sobe quando a pessoa toca no campo; com ponteiro fino, o campo já recebe o foco.
    if (window.matchMedia("(pointer: fine)").matches) field.current?.focus({ preventScroll: true });
    else panel.current?.focus({ preventScroll: true });
  }, [visible]);
  // Teclado virtual: a folha sobe com ele — o campo e o botão de enviar continuam à vista.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = panel.current;
    if (!vv || !el || !visible) return;
    const fit = () => {
      el.style.setProperty("--kb", `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop).toFixed(0)}px`);
      el.style.setProperty("--vvh", `${vv.height.toFixed(0)}px`);
    };
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
    };
  }, [visible]);

  const submit = (text: string, viaVoice = false) => {
    setNotice("");
    setValue("");
    send(text, viaVoice);
  };
  const toggleMic = () => {
    if (listener.current) return stopListening();
    hush();
    setNotice("");
    if (!canListen()) {
      guide.set({ micDenied: true });
      return setNotice(M.ui.micUnsupported);
    }
    guide.set({ phase: "listening", interim: "" });
    listener.current = listen(locale, {
      onInterim: (text) => guide.set({ interim: text }),
      onFinal: (text) => submit(text, true),
      onDenied: () => {
        guide.set({ micDenied: true });
        setNotice(M.ui.micDenied);
        field.current?.focus({ preventScroll: true });
      },
      onSilence: () => setNotice(M.ui.micSilent),
      onEnd: () => {
        listener.current = null;
        guide.set((s) => (s.phase === "listening" ? { phase: "idle", interim: "" } : {}));
      },
    });
    if (!listener.current) {
      guide.set({ phase: "idle", micDenied: true });
      setNotice(M.ui.micUnsupported);
    }
  };
  const act = (action: GuideAction) => {
    if (action.kind === "say") return submit(action.text);
    run(action);
  };

  // Fora da conversa: sobre a área de trabalho, quem chama é a própria figura e os botões sobre ela. Com um app em
  // primeiro plano eles ficam atrás da janela — a pílula mantém a Matéria a um toque em qualquer tela do OS.
  if (!open && !focused) return null;
  if (!open || min)
    return (
      <button type="button" className="os-materia-bubble" data-unread={unread ? "1" : "0"} data-over={focused ?? undefined} data-no-inspect onClick={() => (open ? guide.set({ min: false, unread: false, ...(window.matchMedia(DESKTOP_WIDE_MQ).matches ? {} : { portal: null }) }) : openGuide(M.say.hello, starters()))}>
        <span className="os-materia-talk__dot" aria-hidden="true" />
        <span className="os-materia-bubble__text">
          <strong>{M.ui.name}</strong>
          <span>{open ? M.ui.resume : M.ui.talk}</span>
        </span>
      </button>
    );

  const status = phase === "listening" ? M.ui.listening : phase === "thinking" ? M.ui.thinking : phase === "speaking" ? M.ui.speaking : M.ui.role;
  return (
    <section
      ref={panel}
      className="os-materia-panel"
      role="dialog"
      aria-label={M.ui.log}
      tabIndex={-1}
      data-phase={phase}
      data-no-inspect
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
    >
      <header className="os-materia-panel__bar">
        <span className="os-materia-talk__dot" aria-hidden="true" />
        <p className="os-materia-panel__name">
          <strong>{M.ui.name}</strong>
          <span aria-live="polite">{status}</span>
        </p>
        {phase === "speaking" && (
          <button type="button" className="os-materia-panel__tool" onClick={() => { hush(); guide.set({ phase: "idle" }); }}>
            {M.ui.stopSpeak}
          </button>
        )}
        <button type="button" className="os-materia-panel__icon" aria-label={M.ui.restart} title={M.ui.restart} onClick={() => { stopListening(); hush(); guide.reset(); idea.reset(); openGuide(M.say.hello, starters()); }}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" className="os-materia-panel__icon" aria-label={M.ui.minimize} title={M.ui.minimize} onClick={() => { stopListening(); guide.set({ min: true }); }}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 11.5h9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <button type="button" className="os-materia-panel__icon" aria-label={M.ui.close} title={M.ui.close} onClick={close}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </header>

      <div ref={log} className="os-materia-panel__log" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((m, i) => {
          const project = catalog(m.card);
          const last = i === messages.length - 1;
          return (
            <div key={m.id} className="os-materia-msg" data-from={m.from}>
              <p>{m.text}</p>
              {project && <Card project={project} label={M.ui.openProject} onOpen={() => run({ kind: "project", slug: project.slug, label: M.ui.openProject })} />}
              {last && m.actions && m.actions.length > 0 && (
                <div className="os-materia-msg__actions">
                  {m.actions.map((a, k) => (
                    <button key={k} type="button" data-kind={a.kind} onClick={() => act(a)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {phase === "listening" && (
          <div className="os-materia-msg" data-from="you" data-interim="1">
            <p>
              <span className="os-materia-msg__label">{M.ui.heard}: </span>
              {interim || "…"}
            </p>
          </div>
        )}
        {phase === "thinking" && (
          <div className="os-materia-msg" data-from="materia" data-thinking="1" aria-hidden="true">
            <p><i /><i /><i /></p>
          </div>
        )}
      </div>

      <p className="os-materia-panel__notice" role="status">{notice || (micDenied && !voiceOk ? M.ui.micUnsupported : "")}</p>
      <form
        className="os-materia-panel__form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <label className="sr-only" htmlFor="os-materia-input">{M.ui.placeholder}</label>
        <input id="os-materia-input" ref={field} value={value} maxLength={400} autoComplete="off" enterKeyHint="send" placeholder={M.ui.placeholder} onChange={(e) => setValue(e.target.value)} />
        <button type="button" className="os-materia-panel__mic" data-on={phase === "listening" ? "1" : "0"} aria-pressed={phase === "listening"} aria-label={phase === "listening" ? M.ui.micStop : M.ui.mic} title={phase === "listening" ? M.ui.micStop : M.ui.mic} onClick={toggleMic}>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="7" y="2.5" width="6" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <button type="submit" className="os-materia-panel__send" disabled={!value.trim()} aria-label={M.ui.send} title={M.ui.send}>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3.5 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOs, useOsStore } from "../os-shell";
import { APPS, isAppId } from "../registry";
import type { OsProject } from "../types";
import { briefNotes, respond } from "./brain";
import { guide, stage, useGuide, type GuideAction, type GuideMessage } from "./guide-store";
import { canListen, canSpeak, hush, listen, speak, type Listener } from "./voice";

/**
 * A conversa com a Matéria.
 *
 *   MateriaControls  sobre a figura, na área de trabalho: a própria escultura (arraste = dobrar o
 *                    tempo, toque = conversar) e o botão visível "Conversar com a Matéria".
 *   MateriaGuide     o painel (texto e microfone desde o primeiro momento), a pílula que mantém a
 *                    conversa enquanto o visitante navega, e a travessia até a janela do case.
 *
 * Tudo funciona sem o motor 3D, sem voz e sem rede: as respostas vêm de materia/brain.ts, e as ações
 * só alcançam o que o portfólio cadastra — apps do OS, projetos do catálogo, o currículo e os
 * repositórios do perfil, e o pedido de proposta do Hire Rick.
 */
const BRIEF_KEY = "milweb:project-brief";
const reduced = () => typeof window !== "undefined" && (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.osMotion === "reduce");
let nextId = 1;
const stamp = (m: Omit<GuideMessage, "id">): GuideMessage => ({ ...m, id: Date.now() * 100 + (nextId++ % 100) });

function useActions() {
  const { payload, navigate, store } = useOs();
  const catalog = useCallback((slug: string | null) => (slug ? [...payload.projects, ...payload.authorial].find((p) => p.slug === slug) : undefined), [payload]);

  /** A capa aparece refletida na prata; um fragmento se solta com um recorte dela e cresce até a janela real do case. */
  const cross = useCallback(
    (project: OsProject, go: () => void) => {
      guide.set({ reflect: project.slug });
      const anchor = stage.anchor();
      if (!stage.live() || reduced() || !anchor) return go();
      const img = new window.Image();
      img.src = project.image;
      const started = performance.now();
      let gone = false;
      const open = () => {
        if (gone) return;
        gone = true;
        go();
      };
      // A abertura nunca espera: sem a imagem pronta em 650 ms, a janela abre sem o fragmento.
      const fallback = window.setTimeout(open, 900);
      const launch = () => {
        if (gone) return;
        window.clearTimeout(fallback);
        const size = Math.max(84, anchor.k * 0.42);
        const el = document.createElement("div");
        el.className = "os-materia-shard";
        el.style.backgroundImage = `url("${project.image}")`;
        const from = { left: anchor.x - size / 2, top: anchor.y - size / 2, width: size, height: size };
        const shard = "polygon(18% 6%, 92% 0%, 100% 78%, 34% 100%, 0% 42%)";
        Object.assign(el.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, clipPath: shard, opacity: "0.2" });
        document.body.appendChild(el);
        open();
        // A janela real do case monta nos quadros seguintes: o fragmento espera por ela (no máximo 450 ms) e cresce
        // até coincidir com o retângulo dela — medido sem a animação de entrada. No telefone o case ocupa a tela.
        const phone = store.getState().shell === "mobile";
        const since = performance.now();
        const aim = () => {
          const win = document.querySelector<HTMLElement>('.os-window[data-app="projects"]');
          const ready = !!win && win.offsetWidth > 40;
          if (!ready && performance.now() - since < 450) return void requestAnimationFrame(aim);
          const layer = win?.offsetParent?.getBoundingClientRect();
          const to = ready && win && !phone ? { left: (layer?.left ?? 0) + win.offsetLeft, top: (layer?.top ?? 0) + win.offsetTop, width: win.offsetWidth, height: win.offsetHeight } : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
          const full = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)";
          const anim = el.animate(
            [
              { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, clipPath: shard, opacity: 0.2, offset: 0 },
              { clipPath: "polygon(12% 8%, 96% 2%, 98% 86%, 22% 100%, 2% 38%)", opacity: 1, offset: 0.18 },
              { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, clipPath: full, opacity: 1, offset: 0.82 },
              { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, clipPath: full, opacity: 0, offset: 1 },
            ],
            { duration: 860, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" },
          );
          const done = () => el.remove();
          anim.onfinish = done;
          anim.oncancel = done;
          window.setTimeout(done, 1400);
        };
        requestAnimationFrame(aim);
      };
      const ready = () => window.setTimeout(launch, Math.max(0, 620 - (performance.now() - started)));
      if (img.complete && img.naturalWidth > 0) ready();
      else {
        img.onload = ready;
        img.onerror = open;
        window.setTimeout(() => {
          if (!img.complete) open();
        }, 650);
      }
    },
    [store],
  );

  /** Só o que o portfólio cadastra: apps do OS, projetos do catálogo, arquivos e endereços do perfil, o pedido de proposta. */
  return useCallback(
    (action: GuideAction): boolean => {
      const phone = store.getState().shell === "mobile";
      const leave = () => guide.set({ min: phone ? true : guide.get().min, reflect: null });
      if (action.kind === "app") {
        const route = isAppId(action.app) ? APPS[action.app].route : null;
        if (!route) return false;
        leave();
        navigate(route, "push", true);
        return true;
      }
      if (action.kind === "project") {
        const project = catalog(action.slug);
        if (!project) return false;
        if (phone) guide.set({ min: true });
        cross(project, () => navigate(`/work/${project.slug}`, "push", true));
        return true;
      }
      if (action.kind === "file") {
        const allowed = [payload.profile.cv.href, payload.profile.links.github, payload.profile.links.linkedin, ...payload.profile.projects.flatMap((p) => p.code.map((c) => c.url))];
        if (!allowed.includes(action.href)) return false;
        return !!window.open(action.href, "_blank", "noopener");
      }
      if (action.kind === "brief") {
        const ctx = guide.get().ctx;
        try {
          const prev = JSON.parse(localStorage.getItem(BRIEF_KEY) ?? "null") ?? {};
          const text = (v: unknown) => (typeof v === "string" ? v : "");
          const old = text(prev.notes);
          const fresh = briefNotes(ctx, payload.materia.say.briefQuestion).split("\n").filter((line) => line && !old.split("\n").includes(line));
          const project = catalog(ctx.project)?.slug ?? text(prev.project);
          const draft = {
            goalId: project === text(prev.project) ? text(prev.goalId) : "",
            status: text(prev.status), budget: text(prev.budget), when: text(prev.when),
            notes: [old.trim(), ...fresh].filter(Boolean).join("\n").slice(0, 1400),
            project, service: project ? "" : text(prev.service), review: true, at: Date.now(),
          };
          localStorage.setItem(BRIEF_KEY, JSON.stringify(draft));
          window.dispatchEvent(new Event("milweb:brief"));
        } catch {
          /* sem armazenamento: o pedido abre vazio e a conversa continua visível para copiar */
        }
        leave();
        navigate("/contact", "push", true);
        return true;
      }
      return false;
    },
    [catalog, cross, navigate, payload, store],
  );
}

/** Enviar uma mensagem: responde, guarda o que aprendeu e roda a ação que a resposta pede. */
function useSend() {
  const { payload, locale, store } = useOs();
  const run = useActions();
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  return useCallback(
    (raw: string, viaVoice = false) => {
      const text = raw.trim();
      if (!text) return;
      hush();
      const g = guide.get();
      const route = store.getState().wins.projects.open && store.getState().focused === "projects" ? store.getState().wins.projects.route : null;
      const here = { project: route?.startsWith("/work/") ? route.slice(6) : null };
      const reply = respond(text, g.ctx, payload, here);
      guide.set({ messages: [...g.messages, stamp({ from: "you", text })], phase: "thinking", interim: "", ctx: reply.ctx });
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
          if (reply.run && !opened && reply.run.kind !== "file") timers.current.push(window.setTimeout(() => run(reply.run!), quick ? 0 : 520));
        }, quick ? 0 : 420),
      );
    },
    [locale, payload, run, store],
  );
}

function openGuide(hello: string, starters: GuideAction[]) {
  const g = guide.get();
  guide.set({ open: true, min: false, unread: false, messages: g.messages.length ? g.messages : [stamp({ from: "materia", text: hello, actions: starters })] });
}

/** Sobre a figura: a escultura (arraste de lado = dobrar o tempo; toque = conversar) e o botão da conversa. */
export function MateriaControls() {
  const { payload } = useOs();
  const M = payload.materia;
  const open = useGuide((s) => s.open && !s.min);
  const drag = useRef<{ id: number; x: number; moved: boolean } | null>(null);
  /** Quando um arraste terminou: o clique que alguns navegadores disparam em seguida não abre a conversa. */
  const dragged = useRef(0);
  const release = () => {
    if (drag.current?.moved) dragged.current = performance.now();
    drag.current = null;
    stage.pull?.(null);
  };
  const start = () => openGuide(M.say.hello, [M.say.chipRecruiter, M.say.chipSite, M.say.chipTour, M.say.chipHow].map((label) => ({ kind: "say", text: label, label })));

  return (
    <div className="os-materia-ui" data-open={open ? "1" : "0"} data-no-inspect>
      <button
        type="button"
        className="os-materia-hit"
        aria-label={M.ui.figure}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          drag.current = { id: e.pointerId, x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 10) d.moved = true;
          if (d.moved) stage.pull?.({ x: Math.max(-1, Math.min(1, dx / 90)), y: 0 });
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onClick={() => {
          if (performance.now() - dragged.current > 500) start();
        }}
      />
      <button type="button" className="os-materia-talk" onClick={start}>
        <span className="os-materia-talk__dot" aria-hidden="true" />
        {M.ui.talk}
      </button>
    </div>
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
  const focused = useOsStore((s) => s.focused);
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState("");
  const [voiceOk, setVoiceOk] = useState(false);
  const send = useSend();
  const run = useActions();
  const listener = useRef<Listener | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const catalog = (slug?: string) => (slug ? [...payload.projects, ...payload.authorial].find((p) => p.slug === slug) : undefined);

  // Depois de hidratar: retoma a conversa da aba e descobre se o navegador reconhece voz.
  useEffect(() => {
    guide.restore();
    setVoiceOk(canListen());
  }, []);

  const stopListening = useCallback(() => {
    listener.current?.stop();
    listener.current = null;
    guide.set((s) => (s.phase === "listening" ? { phase: "idle", interim: "" } : {}));
  }, []);
  const close = useCallback(() => {
    stopListening();
    hush();
    guide.set({ open: false, min: false, phase: "idle", reflect: null, interim: "" });
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

  // Fora da conversa: sobre a área de trabalho, quem chama é a própria figura e o botão sobre ela. Com um app em
  // primeiro plano eles ficam atrás da janela — a pílula mantém a Matéria a um toque em qualquer tela do OS.
  if (!open && !focused) return null;
  if (!open || min)
    return (
      <button
        type="button"
        className="os-materia-bubble"
        data-unread={unread ? "1" : "0"}
        data-no-inspect
        onClick={() => (open ? guide.set({ min: false, unread: false }) : openGuide(M.say.hello, [M.say.chipRecruiter, M.say.chipSite, M.say.chipTour, M.say.chipHow].map((label) => ({ kind: "say", text: label, label }))))}
      >
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
        <button type="button" className="os-materia-panel__icon" aria-label={M.ui.restart} title={M.ui.restart} onClick={() => { stopListening(); hush(); guide.reset(); openGuide(M.say.hello, [M.say.chipRecruiter, M.say.chipSite, M.say.chipTour, M.say.chipHow].map((label) => ({ kind: "say", text: label, label }))); }}>
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

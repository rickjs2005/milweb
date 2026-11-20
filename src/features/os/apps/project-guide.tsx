"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { OsProject } from "../types";
import { useOs } from "../os-shell";
import { GuideQuestions } from "./guide-questions";
import styles from "./project-guide.module.css";

type Brief = { goalId: string; status: string; budget: string; when: string; notes: string; review: boolean };

export function ProjectGuide({ initialProject, initialService }: { initialProject?: OsProject; initialService?: string }) {
  const { payload } = useOs();
  const contact = payload.contact;
  const { copy, goals } = contact.guide;
  const initialGoal = goals.find((g) => g.project === initialProject?.slug)
    ?? (initialProject?.tourism ? goals.find((g) => g.id === "bookings") : undefined)
    ?? goals.find((g) => g.service === initialService && g.id !== "bookings");
  const key = "milweb:project-brief:" + [payload.locale, initialProject?.slug, initialService].join("/");
  const [brief, setBrief] = useState<Brief>({ goalId: "", status: "", budget: "", when: "", notes: "", review: false });
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  const preview = useRef<HTMLTextAreaElement>(null);
  const focusOnChange = useRef(false);

  // Keep the draft in this tab when a visitor returns from a case or an email app.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const value = JSON.parse(raw);
        if (value && ["goalId", "status", "budget", "when", "notes"].every((k) => typeof value[k] === "string") && typeof value.review === "boolean") {
          setBrief({ goalId: value.goalId, status: value.status, budget: value.budget, when: value.when, notes: value.notes, review: value.review });
        }
      }
    } catch { /* Private browsing can disable storage. */ }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(key, JSON.stringify(brief)); } catch { /* The in-memory draft still works. */ }
  }, [brief, key, ready]);

  useEffect(() => {
    if (focusOnChange.current) {
      title.current?.focus();
      focusOnChange.current = false;
    }
  }, [brief.review]);

  const chosen = goals.find((g) => g.id === brief.goalId);
  const goal = chosen ?? initialGoal;
  const reference = chosen ? undefined : initialProject;
  const matchedSlug = goal?.project ?? goals[0].project;
  const example = reference ?? payload.projects.find((project) => project.slug === matchedSlug);
  const service = payload.services.items.find((item) => item.slug === goal?.service);
  const status = contact.statuses.find((item) => item.key === brief.status);
  const message = [
    copy.greeting,
    goal && copy.goalField + ": " + goal.label,
    example && (goal || reference) && copy.refField + ": " + example.title,
    status && copy.situation + " " + status.label,
    brief.budget.trim() && copy.budget + ": " + brief.budget.trim(),
    brief.when.trim() && copy.when + ": " + brief.when.trim(),
    brief.notes.trim() && copy.details + ": " + brief.notes.trim(),
    copy.closing,
  ].filter(Boolean).join("\n");
  const mailQuery = new URLSearchParams({ subject: copy.subject, body: message }).toString().replace(/\+/g, "%20");
  const waQuery = new URLSearchParams({ text: message });

  const field = (name: "status" | "budget" | "when" | "notes", value: string) => {
    setNotice("");
    setBrief((prev) => ({ ...prev, [name]: value }));
  };

  function showReview(review: boolean, question = "") {
    setNotice("");
    focusOnChange.current = true;
    setBrief((prev) => ({
      ...prev, review,
      notes: question && !prev.notes.split("\n").includes(question) ? [prev.notes.trim(), question].filter(Boolean).join("\n") : prev.notes,
    }));
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setNotice(copy.copied);
    } catch {
      preview.current?.focus();
      preview.current?.select();
      setNotice(copy.manual);
    }
  }

  return (
    <div className={styles.guide} data-no-inspect>
      {brief.review ? (
        <>
          <button className={styles.textLink} type="button" onClick={() => showReview(false)}>{copy.back}</button>
          <h2 ref={title} tabIndex={-1} className={styles.title}>{copy.review}</h2>
          <p className={styles.intro}>{copy.reviewIntro}</p>
          <div className={styles.fields}>
            <label className={styles.full}>{copy.notes}
              <textarea value={brief.notes} rows={3} maxLength={1400} placeholder={copy.placeholder} onChange={(e) => field("notes", e.target.value)} />
            </label>
            <label className={styles.full}>{copy.situation}
              <select value={brief.status} onChange={(e) => field("status", e.target.value)}>
                <option value="">{copy.optional}</option>
                {contact.statuses.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
            </label>
            <label>{copy.budget}<input value={brief.budget} maxLength={60} placeholder={copy.optional} onChange={(e) => field("budget", e.target.value)} /></label>
            <label>{copy.when}<input value={brief.when} maxLength={80} placeholder={copy.optional} onChange={(e) => field("when", e.target.value)} /></label>
          </div>
          <div id="project-guide-handoff" className={styles.handoff}>
            <label className={styles.caption}>{copy.preview}
              <textarea className={styles.preview} ref={preview} value={message} readOnly rows={Math.min(12, message.split("\n").length + 2)} />
            </label>
            <div className={styles.actions}>
              <a href={"mailto:" + contact.email + "?" + mailQuery} className={styles.primary}>{copy.email}</a>
              <a href={contact.waHref + "?" + waQuery} target="_blank" rel="noopener noreferrer" className={styles.secondary}>{copy.whatsapp}</a>
              <button type="button" className={styles.textLink} onClick={copyMessage}>{copy.copy}</button>
            </div>
            <p className={styles.hint}>{copy.sendHint}</p>
            <p role="status" className={styles.hint}>{notice}</p>
          </div>
        </>
      ) : (
        <>
          <header className={styles.head}>
            <p className={styles.caption}>{contact.location}</p>
            <div className={styles.titleRow}>
              <h2 ref={title} tabIndex={-1} className={styles.title}>{contact.title.join(" ")}</h2>
              <button type="button" onClick={() => showReview(true)} className={styles.primary}>{copy.proposal}</button>
            </div>
            <p className={styles.intro}>{contact.intro}</p>
          </header>
          <fieldset className="os-contact__composer">
            <legend className={styles.heading}>{copy.goal}</legend>
            <div className={styles.goals}>
              {goals.map((option) => (
                <button key={option.id} type="button" aria-pressed={goal?.id === option.id} onClick={() => setBrief((prev) => ({ ...prev, goalId: option.id }))}>
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          {example && (
            <article className={styles.example} aria-live="polite">
              <a className={styles.shot} href={example.href} target="_blank" rel="noopener noreferrer" aria-label={copy.case + " · " + example.title + " · " + payload.s.social.external}>
                <Image src={example.image} alt="" fill sizes="(max-width: 600px) 90vw, 340px" />
              </a>
              <div className={styles.story}>
                <p className={styles.caption}>{goal || reference ? copy.reference : copy.featured} · {payload.s.projects[example.kind]}</p>
                <h3>{example.title}</h3>
                <p>{goal?.project === example.slug ? goal.idea : example.tagline}</p>
                <a className={styles.textLink} href={example.href} target="_blank" rel="noopener noreferrer">{copy.case}<span className="sr-only"> · {example.title} · {payload.s.social.external}</span></a>
              </div>
            </article>
          )}
          <GuideQuestions key={service?.slug ?? "general"} service={service} copy={copy} generalFaq={contact.guide.faq} onForward={(q) => showReview(true, q)} />
          <button type="button" onClick={() => showReview(true)} className={styles.primary}>{copy.proposal}</button>
        </>
      )}
    </div>
  );
}

// Testes da edição de Halloween (features/os/halloween/config.ts): a janela de datas, a política de
// ambiente e o script inline. Só o comportamento crítico — nada cosmético.
//   node --test scripts/halloween-check.mjs
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { HALLOWEEN_START, HALLOWEEN_END, isInWindow, isHalloweenActive, msUntilNextChange, resolvePolicy, halloweenScript } from "../src/features/os/halloween/config.ts";

const AUTO = { kill: false, force: false };
const at = (iso) => Date.parse(iso);

test("a janela é [28/10/2026 00:00 BRT, 01/11/2026 00:00 BRT): início inclusivo, fim exclusivo", () => {
  assert.equal(HALLOWEEN_START, at("2026-10-28T03:00:00Z"));
  assert.equal(HALLOWEEN_END, at("2026-11-01T03:00:00Z"));
  assert.equal(isInWindow(HALLOWEEN_START - 1), false);
  assert.equal(isInWindow(HALLOWEEN_START), true);
  assert.equal(isInWindow(HALLOWEEN_END - 1), true);
  assert.equal(isInWindow(HALLOWEEN_END), false);
});

test("compara instantes absolutos: o fuso do visitante não muda a virada", () => {
  // 23:59:59 de 27/10 em Brasília ainda é normal; 00:00:00 já é Halloween — vistos de qualquer relógio local
  assert.equal(isHalloweenActive(at("2026-10-27T23:59:59-03:00"), AUTO), false);
  assert.equal(isHalloweenActive(at("2026-10-28T00:00:00-03:00"), AUTO), true);
  assert.equal(isHalloweenActive(at("2026-10-28T03:00:00Z"), AUTO), true);
  assert.equal(isHalloweenActive(at("2026-10-27T22:59:59-04:00"), AUTO), false); // 23:59:59 em Brasília
  assert.equal(isHalloweenActive(at("2026-11-01T02:59:59Z"), AUTO), true); // 23:59:59 de 31/10 em Brasília
  assert.equal(isHalloweenActive(at("2026-11-01T03:00:00Z"), AUTO), false);
  assert.equal(isHalloweenActive(at("2026-11-01T00:00:00-03:00"), AUTO), false);
});

test("não reativa em anos futuros", () => {
  assert.equal(isHalloweenActive(at("2027-10-29T12:00:00-03:00"), AUTO), false);
  assert.equal(isHalloweenActive(at("2028-10-31T12:00:00-03:00"), AUTO), false);
});

test("a próxima virada: início antes, fim durante, nenhuma depois", () => {
  assert.equal(msUntilNextChange(HALLOWEEN_START - 5_000, AUTO), 5_000);
  assert.equal(msUntilNextChange(HALLOWEEN_START, AUTO), HALLOWEEN_END - HALLOWEEN_START);
  assert.equal(msUntilNextChange(HALLOWEEN_END - 1, AUTO), 1);
  assert.equal(msUntilNextChange(HALLOWEEN_END, AUTO), null);
  assert.equal(msUntilNextChange(HALLOWEEN_START + 1, { kill: false, force: true }), null);
});

test("política: interruptor de emergência vence; prévia só em desenvolvimento ou preview", () => {
  assert.deepEqual(resolvePolicy({}), AUTO);
  assert.deepEqual(resolvePolicy({ off: "off", nodeEnv: "production" }), { kill: true, force: false });
  // produção: a prévia é ignorada, mesmo ligada
  assert.deepEqual(resolvePolicy({ preview: "on", nodeEnv: "production", vercelEnv: "production" }), AUTO);
  assert.deepEqual(resolvePolicy({ preview: "on", nodeEnv: "production" }), AUTO);
  // desenvolvimento e preview da Vercel: vale
  assert.equal(resolvePolicy({ preview: "on", nodeEnv: "development" }).force, true);
  assert.equal(resolvePolicy({ preview: "on", nodeEnv: "production", vercelEnv: "preview" }).force, true);
  // desligar vence a prévia
  const both = resolvePolicy({ off: "off", preview: "on", nodeEnv: "development" });
  assert.equal(isHalloweenActive(at("2026-10-30T12:00:00-03:00"), both), false);
  assert.equal(isHalloweenActive(at("2027-03-01T12:00:00-03:00"), resolvePolicy({ preview: "on", nodeEnv: "development" })), true);
  // em produção, depois do prazo, nada reativa
  assert.equal(isHalloweenActive(at("2026-11-02T12:00:00-03:00"), resolvePolicy({ preview: "on", nodeEnv: "production", vercelEnv: "production" })), false);
});

function runScript(policy, nowIso) {
  const attrs = {};
  const sandbox = {
    Date: class extends Date {
      static now() {
        return at(nowIso);
      }
    },
    document: { documentElement: { setAttribute: (k, v) => (attrs[k] = v) } },
  };
  vm.runInNewContext(halloweenScript(policy), sandbox);
  return attrs;
}

test("o script inline marca o <html> só dentro da janela e força o tema escuro apenas no atributo", () => {
  assert.deepEqual(runScript(AUTO, "2026-10-30T12:00:00-03:00"), { "data-os-event": "halloween", "data-os-theme": "obito" });
  assert.deepEqual(runScript(AUTO, "2026-10-27T23:59:59-03:00"), {});
  assert.deepEqual(runScript(AUTO, "2026-11-01T00:00:00-03:00"), {});
  assert.deepEqual(runScript({ kill: true, force: false }, "2026-10-30T12:00:00-03:00"), {});
  assert.equal(runScript({ kill: false, force: true }, "2027-01-01T00:00:00-03:00")["data-os-event"], "halloween");
});

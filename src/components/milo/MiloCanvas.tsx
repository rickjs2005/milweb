"use client";

import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { MILO } from "./milo.config";
import { MiloNull } from "./MiloNull";
import { LAYER_BG, LAYER_MASK, LAYER_OVERLAY } from "./MiloRig";
import { createCompositeMaterial, createGridMaterial } from "./materials/MiloCompositeMaterial";
import { miloFrame, useMiloStore } from "./useMiloStore";
import type { MiloQuality } from "./milo.types";

/** Lê os tokens de cor do :root (acompanha o modo dev que inverte a paleta). */
function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const c = (name: string, fallback: string) => {
    const v = cs.getPropertyValue(name).trim();
    if (!v) return new THREE.Color(fallback);
    const [r, g, b] = v.split(/\s+/).map(Number);
    return new THREE.Color(r / 255, g / 255, b / 255);
  };
  return { paper: c("--paper", "#F2F0EA"), neutral: c("--neutral", "#DAD8D1"), ink: c("--ink", "#111111"), signal: c("--signal", "#B7FF37") };
}

const SCENE_RT = { depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter } as const;
const MASK_RT = { depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter } as const;

/**
 * Pipeline de render targets (numa cena só, separada por layers):
 *   1. layer 0 → sceneRT   : fundo + grid técnica
 *   2. layer 1 → maskRT    : silhueta do Milo (normais de vista, fresnel, máscara)
 *   3. layer 2 → tela      : composite (desloca as UVs do fundo dentro da máscara)
 *                            + wireframe + partículas por cima
 */
function Pipeline({ quality, panelRef }: { quality: MiloQuality; panelRef: RefObject<HTMLElement | null> }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const q = MILO.quality[quality];
  const dpr = gl.getPixelRatio();
  const sw = Math.max(1, Math.round(size.width * dpr * q.scene));
  const sh = Math.max(1, Math.round(size.height * dpr * q.scene));
  const mw = Math.max(1, Math.round(size.width * dpr * q.mask));
  const mh = Math.max(1, Math.round(size.height * dpr * q.mask));
  const sceneRT = useFBO(sw, sh, SCENE_RT);
  const maskRT = useFBO(mw, mh, MASK_RT);
  // diagnóstico: ?pass=1 só grid · 2 grid+máscara · 3 tudo (padrão)
  const passes = useMemo(() => Number(new URLSearchParams(location.search).get("pass") ?? 3), []);

  const composite = useMemo(() => createCompositeMaterial(), []);
  const grid = useMemo(() => createGridMaterial(), []);
  const quad = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const tokens = useRef(readTokens());

  useEffect(() => {
    const apply = () => {
      tokens.current = readTokens();
      const t = tokens.current;
      grid.uniforms.uPaper.value.copy(t.paper);
      grid.uniforms.uNeutral.value.copy(t.neutral);
      grid.uniforms.uInk.value.copy(t.ink);
      grid.uniforms.uSignal.value.copy(t.signal);
      composite.uniforms.uInk.value.copy(t.ink);
      composite.uniforms.uSignal.value.copy(t.signal);
      composite.uniforms.uPaper.value.copy(t.paper);
      composite.uniforms.uNeutral.value.copy(t.neutral);
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
        if (m?.uniforms?.uInk) {
          m.uniforms.uInk.value.copy(t.ink);
          m.uniforms.uSignal.value.copy(t.signal);
        }
      });
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
    return () => mo.disconnect();
  }, [grid, composite, scene]);

  useEffect(() => {
    return () => {
      composite.dispose();
      grid.dispose();
      quad.dispose();
    };
  }, [composite, grid, quad]);

  const clear = useMemo(() => new THREE.Color(), []);

  useFrame((st) => {
    const f = miloFrame;
    const time = st.clock.elapsedTime;
    const W = size.width * dpr;
    const H = size.height * dpr;

    // grid
    const g = grid.uniforms;
    g.uResolution.value.set(W, H);
    g.uTime.value = time;
    g.uCell.value = MILO.grid.cell * dpr;
    g.uMilo.value.set(f.milo.x, f.milo.y);
    g.uMiloVel.value.set(f.milo.vx, f.milo.vy);
    g.uPulse.value = f.pulse;
    g.uPulseAt.value.set(f.pulseAt.x, f.pulseAt.y);
    g.uEnergy.value = f.energy;

    // composite
    const c = composite.uniforms;
    c.tScene.value = sceneRT.texture;
    c.tMask.value = maskRT.texture;
    c.uResolution.value.set(W, H);
    c.uPointer.value.set(f.pointerUv.x, f.pointerUv.y);
    c.uTime.value = time;
    c.uBody.value = f.params.bodyDistortion;
    c.uMotion.value = f.params.motionDistortion;
    c.uInteraction.value = f.params.interactionDistortion;
    c.uGridBend.value = f.params.gridBend;
    c.uEdgeComp.value = f.params.edgeCompression;
    c.uFalloff.value = f.params.refractionFalloff;
    c.uEdgeStrength.value = f.params.edge;
    c.uNoiseScale.value = f.params.noiseScale;
    c.uNoiseSpeed.value = f.params.noiseSpeed;
    c.uGlitch.value = f.params.glitch;
    c.uVisibility.value = f.visibility;
    c.uEnergy.value = f.energy;
    c.uScrollProgress.value = f.scroll;
    c.uMilo.value.set(f.milo.x, f.milo.y);
    c.uMiloVel.value.set(f.milo.vx, f.milo.vy);
    c.uHand.value.set(f.hand.x, f.hand.y);
    c.uPanel.value = f.panelInfluence;
    c.uPanelUv.value.set(f.panel.x, f.panel.y);
    c.uCell.value = MILO.grid.cell * dpr;

    // painel HTML segue a âncora projetada (transform imperativo, fora do React)
    const el = panelRef.current;
    if (el) {
      const pw = el.offsetWidth || 240;
      const ph = el.offsetHeight || 120;
      // mobile: o painel vive no canto inferior direito, fora da headline
      const narrow = size.width < 720;
      const px = narrow ? size.width - pw * 0.88 - 12 : Math.min(Math.max(f.panel.x * size.width, pw * 0.12 + 12), size.width - pw * 0.88 - 12);
      const py = narrow ? size.height * 0.62 : Math.min(Math.max((1 - f.panel.y) * size.height, ph * 0.5 + 72), size.height - ph * 0.5 - 72);
      // o painel reage: recua alguns px na direção da mão conforme ela se aproxima
      const shiftX = -f.panelInfluence * 6;
      const shiftY = f.panelInfluence * 3;
      el.style.transform = `translate(${(px + shiftX).toFixed(1)}px, ${(py + shiftY).toFixed(1)}px) translate(-12%, -50%)`;
      el.style.setProperty("--panel-influence", f.panelInfluence.toFixed(3));
      const pulsing = f.pulse > 0 ? "1" : "";
      if (el.dataset.pulse !== pulsing) el.dataset.pulse = pulsing;
    }

    const cam = camera;
    if (passes === 1) {
      gl.setRenderTarget(null);
      cam.layers.set(LAYER_BG);
      gl.render(scene, cam);
      return;
    }
    // 1) fundo
    gl.setRenderTarget(sceneRT);
    gl.setClearColor(clear.copy(tokens.current.paper), 1);
    gl.clear(true, false, false);
    cam.layers.set(LAYER_BG);
    gl.render(scene, cam);
    // 2) máscara
    gl.setRenderTarget(maskRT);
    gl.setClearColor(clear.set(0x000000), 0);
    gl.clear(true, true, false);
    cam.layers.set(LAYER_MASK);
    gl.render(scene, cam);
    if (passes === 2) {
      gl.setRenderTarget(null);
      cam.layers.set(LAYER_BG);
      gl.render(scene, cam);
      return;
    }
    // 3) composite + sinais
    gl.setRenderTarget(null);
    gl.setClearColor(clear.copy(tokens.current.paper), 1);
    gl.clear(true, true, false);
    cam.layers.set(LAYER_OVERLAY);
    gl.render(scene, cam);
  }, 1);

  return (
    <>
      <mesh geometry={quad} material={grid} layers={LAYER_BG} frustumCulled={false} renderOrder={-20} />
      <mesh geometry={quad} material={composite} layers={LAYER_OVERLAY} frustumCulled={false} renderOrder={-10} />
    </>
  );
}

function CameraRig({ mobile }: { mobile: boolean }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const [x, y, z] = MILO.camera.position;
    camera.position.set(x, y, z + (mobile ? 0.9 : 0));
    camera.lookAt(MILO.camera.target[0], MILO.camera.target[1] - (mobile ? 0.12 : 0), MILO.camera.target[2]);
    (camera as THREE.PerspectiveCamera).fov = MILO.camera.fov;
    camera.updateProjectionMatrix();
  }, [camera, mobile]);
  return null;
}

/**
 * Canvas do Milo — cobre a viewport, DPR por nível, pausa com aba oculta
 * ou fora da viewport, ponteiro global (o canvas fica atrás do HTML).
 */
export const MiloCanvas = memo(function MiloCanvas({ quality, mobile, panelRef }: { quality: MiloQuality; mobile: boolean; panelRef: RefObject<HTMLElement | null> }) {
  const [active, setActive] = useState(true);
  const holder = useRef<HTMLDivElement>(null);
  const syncFromFrame = useMiloStore((s) => s.syncFromFrame);

  useEffect(() => {
    let visible = !document.hidden;
    let inView = true;
    const update = () => setActive(visible && inView);
    const onVis = () => {
      visible = !document.hidden;
      update();
    };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { threshold: 0.05 },
    );
    if (holder.current) io.observe(holder.current);

    const move = (e: PointerEvent) => {
      miloFrame.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      miloFrame.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      miloFrame.pointerUv.x = e.clientX / window.innerWidth;
      miloFrame.pointerUv.y = 1 - e.clientY / window.innerHeight;
      miloFrame.pointerActive = true;
    };
    const leave = () => (miloFrame.pointerActive = false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    const sync = window.setInterval(syncFromFrame, 250);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.documentElement.removeEventListener("mouseleave", leave);
      window.clearInterval(sync);
    };
  }, [syncFromFrame]);

  const dpr = MILO.quality[quality].dpr;

  return (
    <div ref={holder} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, dpr]}
        frameloop={active ? "always" : "never"}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: MILO.camera.fov, position: MILO.camera.position, near: 0.1, far: 30 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#F2F0EA", 1);
        }}
      >
        <CameraRig mobile={mobile} />
        <Pipeline quality={quality} panelRef={panelRef} />
        <MiloNull quality={quality} mobile={mobile} />
      </Canvas>
    </div>
  );
});

"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { MILO } from "@/components/milo/milo.config";
import { MiloNull } from "@/components/milo/MiloNull";
import { LAYER_BG, LAYER_MASK, LAYER_OVERLAY } from "@/components/milo/MiloRig";
import { createCompositeMaterial } from "@/components/milo/materials/MiloCompositeMaterial";
import { miloFrame } from "@/components/milo/useMiloStore";
import type { MiloQuality } from "@/components/milo/milo.types";
import { MILO_HERO } from "@/features/hero-visual/hero-visual.config";
import { createHeroGridMaterial } from "./MiloHeroGrid";
import { heroFrame } from "./MiloHeroBridge";
import { heroMetrics } from "./useMiloHeroMetrics";
import { useMiloHeroStore } from "./hero-store";

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
const MASK_RT = { depthBuffer: true, stencilBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter } as const;

/**
 * Pipeline do Milo no Hero — os mesmos três passes do laboratório
 * (réplica da grid → sceneRT · silhueta → maskRT · composite + sinais),
 * com duas diferenças: o fundo é a RÉPLICA da grid DOM (alinhada às
 * métricas medidas) e o composite sai TRANSPARENTE fora da silhueta e do
 * halo curvado — o canvas só cobre a grid DOM onde precisa deformá-la.
 * Aquecimento: dois frames invisíveis, o terceiro é medido (gl.finish);
 * acima do orçamento → onFail (o MiloHero desmonta e volta ao SVG).
 */
function HeroPipeline({ quality, onReady, onFail }: { quality: MiloQuality; onReady: () => void; onFail: () => void }) {
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
  const composite = useMemo(() => {
    const m = createCompositeMaterial();
    m.uniforms.uHero.value = 1;
    m.blending = THREE.NoBlending;
    return m;
  }, []);
  const grid = useMemo(() => createHeroGridMaterial(), []);
  const quad = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const tokens = useRef(readTokens());
  const clear = useMemo(() => new THREE.Color(), []);
  const frames = useRef(0);
  const decided = useRef(false);
  const cb = useRef({ onReady, onFail });
  cb.current = { onReady, onFail };

  useEffect(() => {
    const apply = () => {
      tokens.current = readTokens();
      const t = tokens.current;
      grid.uniforms.uHeroBackground.value.copy(t.paper);
      grid.uniforms.uGridLineColor.value.copy(t.neutral);
      composite.uniforms.uInk.value.copy(t.ink);
      composite.uniforms.uSignal.value.copy(t.signal);
      composite.uniforms.uPaper.value.copy(t.paper);
      composite.uniforms.uNeutral.value.copy(t.neutral);
      composite.uniforms.uHeroBackground.value.copy(t.paper);
      composite.uniforms.uGridLineColor.value.copy(t.neutral);
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

  useFrame((st) => {
    const f = miloFrame;
    const time = st.clock.elapsedTime;
    const W = size.width * dpr;
    const H = size.height * dpr;
    const m = heroMetrics;

    // réplica da grid DOM (px de dispositivo, y para baixo)
    const g = grid.uniforms;
    g.uViewport.value.set(W, H);
    g.uGridOrigin.value.set(m.origin.x * dpr, m.origin.y * dpr);
    g.uGridSize.value.set(m.size.w * dpr, m.size.h * dpr);
    g.uGridColumns.value = m.columns;
    g.uGridColumnWidth.value = m.columnWidth * dpr;
    g.uGridGutter.value = m.gutter * dpr;
    g.uGridRowHeight.value = m.rowHeight * dpr;
    g.uGridLineWidth.value = m.lineWidth * dpr;
    g.uGridOpacity.value = m.ready ? heroFrame.gridOpacity : 0;

    const c = composite.uniforms;
    c.tScene.value = sceneRT.texture;
    c.tMask.value = maskRT.texture;
    c.uResolution.value.set(W, H);
    c.uPointer.value.set(f.pointerUv.x, f.pointerUv.y);
    c.uTime.value = time;
    c.uBody.value = f.params.bodyDistortion;
    c.uMotion.value = f.params.motionDistortion;
    c.uInteraction.value = f.params.interactionDistortion;
    c.uGridBend.value = f.params.gridBend * heroFrame.bendMul;
    c.uEdgeComp.value = f.params.edgeCompression;
    c.uFalloff.value = f.params.refractionFalloff;
    c.uEdgeStrength.value = f.params.edge;
    c.uNoiseScale.value = f.params.noiseScale;
    c.uNoiseSpeed.value = f.params.noiseSpeed;
    c.uGlitch.value = f.params.glitch;
    c.uDensity.value = f.params.bodyDensity;
    c.uMaskBlur.value = f.params.maskBlur * dpr;
    c.uMaskDilate.value = f.params.maskDilation * dpr;
    c.uInternalShadow.value = f.params.internalShadow;
    c.uView.value = 0;
    c.uPulse.value = f.pulse;
    c.uVisibility.value = f.visibility;
    c.uEnergy.value = f.energy;
    c.uScrollProgress.value = f.scroll;
    c.uMilo.value.set(f.milo.x, f.milo.y);
    c.uMiloVel.value.set(f.milo.vx, f.milo.vy);
    c.uHand.value.set(f.hand.x, f.hand.y);
    c.uHeadUv.value.set(f.head.x, f.head.y);
    c.uPanel.value = f.panelInfluence;
    c.uPanelUv.value.set(f.panel.x, f.panel.y);
    c.uPelvisDensity.value = f.params.pelvisDensityMultiplier;
    c.uTorsoHatch.value = f.params.torsoHatchingMultiplier;
    c.uThighHatch.value = f.params.thighHatchingMultiplier;
    c.uHeadMul.value = f.params.headDistortionMultiplier;
    c.uFlapMul.value = f.params.coatFlapMultiplier;
    c.uCell.value = MILO.grid.cell * dpr;
    c.uGridOrigin.value.copy(g.uGridOrigin.value);
    c.uGridSize.value.copy(g.uGridSize.value);
    c.uGridColumns.value = m.columns;
    c.uGridColumnWidth.value = g.uGridColumnWidth.value;
    c.uGridGutter.value = g.uGridGutter.value;
    c.uGridLineWidth.value = g.uGridLineWidth.value;
    c.uGridOpacity.value = g.uGridOpacity.value;

    const measure = !decided.current && frames.current === 2;
    const t0 = measure ? performance.now() : 0;
    const cam = camera;
    gl.setRenderTarget(sceneRT);
    gl.setClearColor(clear.copy(tokens.current.paper), 1);
    gl.clear(true, false, false);
    cam.layers.set(LAYER_BG);
    gl.render(scene, cam);
    gl.setRenderTarget(maskRT);
    gl.setClearColor(clear.set(0x000000), 0);
    gl.clear(true, true, false);
    cam.layers.set(LAYER_MASK);
    gl.render(scene, cam);
    gl.setRenderTarget(null);
    gl.setClearColor(clear.set(0x000000), 0);
    gl.clear(true, true, false);
    cam.layers.set(LAYER_OVERLAY);
    gl.render(scene, cam);

    if (!decided.current) {
      frames.current++;
      if (measure) {
        gl.getContext().finish();
        const ms = performance.now() - t0;
        decided.current = true;
        if (ms > MILO_HERO.frameBudgetMs) cb.current.onFail();
        else cb.current.onReady();
      }
    }
  }, 1);

  return (
    <>
      <mesh geometry={quad} material={grid} layers={LAYER_BG} frustumCulled={false} renderOrder={-20} />
      <mesh geometry={quad} material={composite} layers={LAYER_OVERLAY} frustumCulled={false} renderOrder={-10} />
    </>
  );
}

function CameraRig() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const [x, y, z] = MILO.camera.position;
    camera.position.set(x, y, z);
    camera.lookAt(MILO.camera.target[0], MILO.camera.target[1], MILO.camera.target[2]);
    (camera as THREE.PerspectiveCamera).fov = MILO.camera.fov;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/** Colocação do Milo no mundo a partir do cx desejado na viewport (câmera fixa a 5,6 de z=0). */
function heroPlacement(aspect: number) {
  const halfH = MILO.camera.position[2] * Math.tan((MILO.camera.fov * Math.PI) / 360);
  const halfW = halfH * aspect;
  return { x: (MILO_HERO.cx * 2 - 1) * halfW, y: MILO_HERO.y, z: 0, scale: MILO_HERO.scale, yaw: MILO_HERO.yaw };
}

function Placed({ quality }: { quality: MiloQuality }) {
  const size = useThree((s) => s.size);
  const placement = useMemo(() => heroPlacement(size.width / Math.max(1, size.height)), [size.width, size.height]);
  return <MiloNull quality={quality} mobile={false} environment="hero" placement={placement} />;
}

export const MiloHeroCanvas = memo(function MiloHeroCanvas({ quality, onReady, onFail }: { quality: MiloQuality; onReady: () => void; onFail: () => void }) {
  const heroVisible = useMiloHeroStore((s) => s.heroVisible);
  const ready = useMiloHeroStore((s) => s.ready);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let docVisible = !document.hidden;
    const onVis = () => {
      docVisible = !document.hidden;
      useMiloHeroStore.getState().setHeroVisible(docVisible && useMiloHeroStore.getState().heroVisible);
    };
    document.addEventListener("visibilitychange", onVis);
    const move = (e: PointerEvent) => {
      miloFrame.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      miloFrame.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      miloFrame.pointerUv.x = e.clientX / window.innerWidth;
      miloFrame.pointerUv.y = 1 - e.clientY / window.innerHeight;
      miloFrame.pointerActive = true;
    };
    const leave = () => (miloFrame.pointerActive = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  const dpr = MILO.quality[quality].dpr;
  return (
    <div ref={holder} className="milo-hero-canvas pointer-events-none fixed inset-0 z-[2] h-[100dvh] w-full" data-ready={ready && heroVisible ? "1" : undefined} aria-hidden="true" data-inspect="CANVAS / MILO NULL">
      <Canvas
        dpr={[1, dpr]}
        frameloop={heroVisible ? "always" : "never"}
        gl={{ antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: MILO.camera.fov, position: MILO.camera.position, near: 0.1, far: 30 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <CameraRig />
        <HeroPipeline quality={quality} onReady={onReady} onFail={onFail} />
        <Placed quality={quality} />
      </Canvas>
    </div>
  );
});

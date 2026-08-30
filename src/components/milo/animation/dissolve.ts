import type { MiloRigHandle } from "../milo.types";

/**
 * Dissolve — o corpo em si é dissolvido nos shaders (máscara, wireframe e
 * partículas leem `uVisibility`); aqui fica só o que é pose: à medida que
 * some, o Milo "solta" a postura (ombros caem, cabeça baixa um pouco),
 * e ao voltar retoma — tudo função de `visibility`, portanto reversível.
 */
export function applyDissolve(rig: MiloRigHandle, visibility: number) {
  const gone = 1 - visibility;
  if (gone <= 0.001) return;
  const b = rig.bones;
  b.head.group.rotation.x += gone * 0.18;
  b.leftShoulder.group.rotation.z += -gone * 0.1;
  b.rightShoulder.group.rotation.z += gone * 0.1;
  b.chest.group.rotation.x += gone * 0.06;
  b.leftArm.group.rotation.z += gone * 0.08;
  b.rightArm.group.rotation.z += -gone * 0.08;
  rig.root.position.y += -gone * 0.03;
}

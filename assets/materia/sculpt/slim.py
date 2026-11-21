"""
MATÉRIA · esculturas — emagrece uma fonte .blend já gravada (roda dentro do Blender):

  blender -b arquivo.blend --python assets/materia/sculpt/slim.py

Tira a malha densa de colisão e os caches da simulação: ficam as partes simplificadas, os tecidos assentados (como
malha) e os braços. Tudo o que sai se refaz com build.py --stage.
"""
import bpy

dg = bpy.context.evaluated_depsgraph_get()
for ob in list(bpy.data.objects):
    if ob.name == "collision":
        bpy.data.objects.remove(ob, do_unlink=True)
    elif ob.type == "MESH" and ob.modifiers:
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        old = ob.data
        ob.modifiers.clear()
        ob.data = me
        if old.users == 0:
            bpy.data.meshes.remove(old)
bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, compress=True)
print("SLIM", bpy.data.filepath)

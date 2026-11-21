"""
MATÉRIA · esculturas — prévia no Blender (roda dentro dele):

  blender -b --python assets/materia/sculpt/view.py -- partes.npz saida.png [--sil] [--cam cx cy meia_altura] [--size w h] [--yaw graus]

Carrega as partes (`<nome>__v`, `<nome>__f`, em unidades da cena: x direita, y cima, z para quem olha), e renderiza
de frente com a mesma abertura da câmera do site. `--sil`: silhueta preta sobre branco (a prova de leitura da pose).
"""
import math
import sys

import bpy
import numpy as np

args = sys.argv[sys.argv.index("--") + 1 :]
src, out = args[0], args[1]
opt = lambda k, n, d: [float(x) for x in args[args.index(k) + 1 : args.index(k) + 1 + n]] if k in args else d
sil = "--sil" in args
cx, cy, half = opt("--cam", 3, [0.0, 4.2, 4.8])
w, h = [int(x) for x in opt("--size", 2, [900, 1100])]
yaw = opt("--yaw", 1, [0.0])[0]
FOV = 24.0

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
data = np.load(src)
names = sorted({k.split("__")[0] for k in data.files})
for name in names:
    v = data[name + "__v"].astype(float)
    f = data[name + "__f"]
    me = bpy.data.meshes.new(name)
    me.from_pydata(np.stack([v[:, 0], -v[:, 2], v[:, 1]], axis=1).tolist(), [], f.tolist())
    me.update()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    scn.collection.objects.link(ob)

cam_d = bpy.data.cameras.new("cam")
cam_d.sensor_fit = "VERTICAL"
cam_d.angle_y = math.radians(FOV)
cam_d.clip_start = 0.5
cam_d.clip_end = 400
cam = bpy.data.objects.new("cam", cam_d)
scn.collection.objects.link(cam)
D = half / math.tan(math.radians(FOV) / 2)
a = math.radians(yaw)
cam.location = (cx + D * math.sin(a), -D * math.cos(a), cy)
cam.rotation_euler = (math.pi / 2, 0, a)
scn.camera = cam
scn.render.engine = "BLENDER_WORKBENCH"
scn.render.resolution_x = w
scn.render.resolution_y = h
scn.render.resolution_percentage = 100
scn.view_settings.view_transform = "Standard"
world = bpy.data.worlds.new("w")
scn.world = world
sh = scn.display.shading
sh.color_type = "SINGLE"
if sil:
    world.color = (1, 1, 1)
    sh.light = "FLAT"
    sh.single_color = (0, 0, 0)
    sh.show_shadows = False
    sh.show_cavity = False
    scn.display.render_aa = "8"
else:
    world.color = (0.035, 0.035, 0.04)
    sh.light = "STUDIO"
    sh.single_color = (0.86, 0.83, 0.78)
    sh.show_shadows = True
    sh.shadow_intensity = 0.55
    scn.display.light_direction = (-0.62, 0.35, 0.7)
    sh.show_cavity = True
    sh.cavity_type = "BOTH"
    sh.cavity_ridge_factor = 0.6
    sh.cavity_valley_factor = 1.4
    sh.show_specular_highlight = False
scn.render.filepath = out
bpy.ops.render.render(write_still=True)
print("VIEW", out)

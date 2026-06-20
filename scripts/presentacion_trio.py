from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
INK=(14,12,9); BG2=(30,26,18); GOLD=(201,162,39); GOLDB=(247,216,104); CREAM=(247,240,224); WHITE=(255,255,255)
PURP=(150,90,210); MFG=(212,175,55); PORCI=(70,150,70)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
W,H=1080,1350
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(18+t*12),int(15+t*9),int(11+t*6)))
# halo
glow=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(glow).ellipse([W//2-560,-360,W//2+560,300],fill=(201,162,39,40))
img=Image.alpha_composite(img.convert('RGBA'),glow).convert('RGB'); dr=ImageDraw.Draw(img)
# confeti dorado
for i in range(60):
    x=(i*97+40)%W; yy=(i*61+25)%H; s=4+(i%3)*3; dr.rectangle([x,yy,x+s,yy+int(s*1.6)],fill=GOLD if i%2 else GOLDB)
dr.rectangle([12,12,W-12,H-12],outline=GOLD,width=5)

# Título
dr.text((W//2,34),'LA POLLA DE ALAMEDA',font=FB(34),fill=GOLDB,anchor='ma',stroke_width=3,stroke_fill=INK)
dr.text((W//2,84),'PRESENTA A SUS PATROCINADORES',font=F(24),fill=CREAM,anchor='ma',stroke_width=2,stroke_fill=INK)

# Las dos mascotas grandes, una frente a otra
def mascot(path, x, size):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,150),m)
mascot('public/mfito-head.png', 70, 420)
mascot('public/cerdino-head.png', W-70-420, 420)
dr=ImageDraw.Draw(img)
# VS dorado en el centro
dr.ellipse([W//2-56,330,W//2+56,442],fill=INK,outline=GOLDB,width=5)
dr.text((W//2,360),'&',font=FB(56),fill=GOLDB,anchor='ma')
# nombres bajo cada mascota
dr.text((280,584),'MFITO',font=FB(40),fill=MFG,anchor='ma',stroke_width=2,stroke_fill=INK)
dr.text((280,628),'el cóndor de los pronósticos',font=F(17,bold=False),fill=CREAM,anchor='ma')
dr.text((W-280,584),'CERDIÑO',font=FB(40),fill=(120,200,120),anchor='ma',stroke_width=2,stroke_fill=INK)
dr.text((W-280,628),'el que anuncia quién paga el cerdo',font=F(16,bold=False),fill=CREAM,anchor='ma')

# Tarjetas de patrocinadores
y=700
cards=[
 ('PATROCINADOR PRINCIPAL', 'INPLUX SAS', 'Donó la app a la natillera. El cerebro de IA que lo hizo posible.', PURP),
 ('PATROCINA LOS PRONÓSTICOS', 'MF GROUP  ·  MFito 🦅', 'El cóndor profeta (que casi nunca acierta, pero con estilo).', MFG),
 ('PATROCINA EL CASTIGO', 'UNIÓN PORCÍCOLA  ·  Cerdiño 🐷', 'Donde el último compra el cerdo. ¡Salud y a pagar!', PORCI),
]
for tag,nombre,desc,col in cards:
    dr.rounded_rectangle([45,y,W-45,y+128],radius=18,fill=BG2,outline=col,width=3)
    dr.rectangle([45,y,58,y+128],fill=col)
    dr.text((78,y+16),tag,font=F(17),fill=col)
    dr.text((78,y+42),nombre,font=FB(30),fill=WHITE)
    dr.text((78,y+86),desc,font=F(17,bold=False),fill=CREAM)
    y+=144

# Pie
dr.text((W//2,y+6),'Tres marcas, un solo parche, y un cerdo en juego 🐷⚽',font=FB(22),fill=GOLDB,anchor='ma')
dr.text((W//2,H-46),'pollamundialnatillera.vercel.app',font=FB(20),fill=GOLD,anchor='ma')
img.save('/tmp/trio.png'); print('OK',img.size)

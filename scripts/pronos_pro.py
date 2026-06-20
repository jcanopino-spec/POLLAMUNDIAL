from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, json, sys
sys.path.insert(0, '/Users/jacp/mundial2026-simulador/src')
d = json.load(open('/tmp/pbel.json'))
# Paleta
INK=(16,14,11); BG2=(30,26,18); GOLD=(201,162,39); GOLDB=(247,216,104); CREAM=(247,240,224); WHITE=(255,255,255)
ORANGE=(232,140,40); BLUE=(86,150,235); GREEN=(64,196,120); CARD=(40,35,26); CARD2=(52,46,34)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
# avatar emoji por nombre (subset del de la app)
AV=['🐔','🐓','🦅','⚽','🥅','🧤','🦁','🐆','🦊','😎','🤠','👽','💃','🧢','🍔','🎩','🤓','👑','💈','🍳','📐','🐶','📰','🧱','🛎️','🌽','🪗','🎤','🛍️','🐴']
def av(nm):
    h=0
    for c in nm: h=(h*31+ord(c))%997
    return AV[h%len(AV)]

rows=d['rows']; mt=d['mt']
loc=sorted([r for r in rows if r['h']>r['a']],key=lambda r:(-(r['h']-r['a']),r['nm']))
emp=sorted([r for r in rows if r['h']==r['a']],key=lambda r:r['nm'])
vis=sorted([r for r in rows if r['h']<r['a']],key=lambda r:r['nm'])
percol=max(len(loc),len(emp),len(vis),1)

W=1120
top=430
rowh=44
H=top + 56 + percol*rowh + 230
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
# fondo degradado + halo
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(16+t*14),int(14+t*10),int(11+t*6)))
glow=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(glow).ellipse([W//2-560,-380,W//2+560,260],fill=(201,162,39,40))
img=Image.alpha_composite(img.convert('RGBA'),glow).convert('RGB'); dr=ImageDraw.Draw(img)
dr.rectangle([10,10,W-10,H-10],outline=GOLD,width=5)
dr.rectangle([20,20,W-20,H-20],outline=(70,58,26),width=1)

# Me Frito arriba-izquierda con etiqueta
# Las DOS mascotas oficiales (MFito + Cerdiño) en la esquina superior derecha
_md=190
for _i,_p in enumerate(['public/cerdino-head.png','public/mfito-head.png']):
    _src='/Users/jacp/mundial2026-simulador/'+_p
    if os.path.exists(_src):
        _m=Image.open(_src).convert('RGBA').resize((_md,_md))
        img.paste(_m,(W-_md-10-_i*(_md-70),24),_m)
dr=ImageDraw.Draw(img)
# Cabecera
dr.text((44,44),'⚽ PRONÓSTICOS DEL PARCHE',font=FB(30),fill=GOLDB)
dr.text((44,92),mt['h'].upper(),font=FB(60),fill=WHITE)
dr.text((44,158),'VS '+mt['a'].upper(),font=FB(40),fill=ORANGE)
dr.text((46,214),mt['hora'].upper()+'  ·  GRUPO G',font=F(22),fill=CREAM)
# pill 30/30
dr.rounded_rectangle([46,250,300,294],radius=22,fill=GREEN)
dr.text((173,258),f'¡{len(rows)}/30 JUGARON!',font=FB(22),fill=INK,anchor='ma')

# Banda de chiste
dr.rounded_rectangle([40,312,W-40,392],radius=16,fill=BG2,outline=GOLDB,width=2)
dr.text((60,326),'🦅 ME FRITO ANALIZA:',font=FB(22),fill=GOLDB)
dr.text((60,358),'"29 le copiaron a Bélgica como borregos 🐑. El único rebelde: Martín, de 8 años.',font=F(18,bold=False),fill=CREAM)
dr.text((60,382),'A Egipto no le creyó NADIE. Yo tampoco sé, pero a mí nunca me hacen caso."',font=F(18,bold=False),fill=CREAM)

# 3 columnas con encabezado tipo banderín
colw=(W-80-2*16)//3
heads=[('🇧🇪 GANA BÉLGICA',ORANGE,loc),('🤝 EMPATE',BLUE,emp),('🇪🇬 GANA EGIPTO',GREEN,vis)]
for ci,(title,col,lst) in enumerate(heads):
    x=40+ci*(colw+16)
    dr.rounded_rectangle([x,top,x+colw,top+44],radius=12,fill=col)
    dr.text((x+colw//2,top+9),title+f'  ({len(lst)})',font=FB(18),fill=INK,anchor='ma')
    yy=top+56
    if not lst:
        dr.rounded_rectangle([x,yy,x+colw,yy+44],radius=10,fill=CARD,outline=(60,52,38),width=1)
        dr.text((x+colw//2,yy+10),'nadie 🐷',font=F(17,bold=False),fill=(150,140,120),anchor='ma')
    for i,r in enumerate(lst):
        bg = CARD2 if i%2 else CARD
        dr.rounded_rectangle([x,yy,x+colw,yy+rowh-6],radius=9,fill=bg,outline=(62,54,40),width=1)
        dr.text((x+12,yy+6),av(r['nm']),font=F(20),fill=WHITE)
        dr.text((x+44,yy+8),r['nm'][:13],font=F(15),fill=WHITE)
        sc=f"{r['h']}-{r['a']}"
        dr.rounded_rectangle([x+colw-66,yy+5,x+colw-8,yy+rowh-11],radius=8,fill=GOLDB)
        dr.text((x+colw-37,yy+8),sc,font=FB(17),fill=INK,anchor='ma')
        yy+=rowh

y=top+56+percol*rowh+18
# profecía Me Frito
dr.rounded_rectangle([40,y,W-40,y+96],radius=16,fill=BG2,outline=GOLDB,width=2)
dr.text((60,y+14),'🔮 PROFECÍA DEL CÓNDOR DE TEMU:',font=FB(22),fill=GOLDB)
dr.text((60,y+48),'Bélgica 9-8 en penales... en un partido de grupos. El ave no da una.',font=F(18,bold=False),fill=CREAM)
dr.text((60,y+72),'Truco infalible: apúntenle a lo CONTRARIO del pájaro frito 🍳',font=F(17,bold=False),fill=ORANGE)
y+=112
dr.text((W//2,y),'Marcador exacto = +5 · El último de la jornada, al sancocho con Me Frito 🐷',font=F(18),fill=WHITE,anchor='ma')
dr.text((W//2,H-46),'pollamundialnatillera.vercel.app  ·  patrocina MF GROUP',font=FB(19),fill=GOLD,anchor='ma')
img.save('/tmp/pronos-pro.png'); print('OK',img.size)

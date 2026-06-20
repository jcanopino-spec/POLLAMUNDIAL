from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, json, textwrap
d = json.load(open('/tmp/resumen.json'))
INK=(14,12,9); BG2=(30,26,18); GOLD=(201,162,39); GOLDB=(247,216,104); CREAM=(247,240,224); WHITE=(255,255,255); GREEN=(74,200,130); RED=(228,92,80); CARD=(40,35,26); CARD2=(52,46,34)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
AV=['🐔','🐓','🦅','⚽','🥅','🧤','🦁','🐆','🦊','😎','🤠','👽','💃','🧢','🍔','🎩','🤓','👑','💈','🍳','📐','🐶','📰','🧱','🛎️','🌽','🪗','🎤','🛍️','🐴']
def av(nm):
    h=0
    for c in nm: h=(h*31+ord(c))%997
    return AV[h%len(AV)]
W,H=1120,1880
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(18+t*12),int(15+t*9),int(11+t*6)))
glow=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(glow).ellipse([W//2-560,-360,W//2+560,300],fill=(201,162,39,38))
img=Image.alpha_composite(img.convert('RGBA'),glow).convert('RGB'); dr=ImageDraw.Draw(img)
for i in range(54):
    x=(i*97+40)%W; yy=(i*61+25)%H; s=4+(i%3)*3; dr.rectangle([x,yy,x+s,yy+int(s*1.6)],fill=GOLD if i%2 else GOLDB)
dr.rectangle([10,10,W-10,H-10],outline=GOLD,width=5)

# Cabecera con las dos mascotas
def head(path,x,size,y=24):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src): m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,y),m)
head('public/mfito-head.png', W-180-10, 175, 30)
head('public/cerdino-head.png', W-180-160, 175, 60)
dr=ImageDraw.Draw(img)
dr.text((44,40),'POLLA DE ALAMEDA',font=FB(30),fill=GOLDB)
dr.text((44,84),'BOLETÍN',font=FB(70),fill=WHITE)
dr.text((44,154),'AL CORTE',font=FB(70),fill=GOLDB)
dr.text((46,234),d['fecha']+'  ·  34 partidos jugados',font=F(20),fill=CREAM)

# Crónica de las dos mascotas
y=300
dr.rounded_rectangle([40,y,W-40,y+300],radius=18,fill=CARD,outline=GOLDB,width=2)
dr.text((64,y+16),'🦅 MFITO & 🐷 CERDIÑO REPORTAN:',font=FB(24),fill=GOLDB)
cron=[
 ('🏍️','GERUNDIO el motociclista ARRANCÓ y no para: lidera con 77 y viene clavando marcadores. ¡El brujo de verdad del parche!'),
 ('💃','Y ahora el bullying sabroso: SHAKILA... perdón, SHAKIRA va ÚLTIMA (46). Las caderas no mienten pero los pronósticos sí.'),
 ('🚬','La acompaña DOÑA FLAVIA (48). ¡Las dos ya se unieron para comprar el cerdo a medias en Unión Porcícola! 🐷🤝'),
 ('🆙','Noticia buena: ESTUPIÑAN salió del fondo. De colero eterno a clase media. ¡Milagro!'),
]
yy=y+56
for em,tx in cron:
    dr.text((64,yy),em,font=FB(26),fill=WHITE)
    wr=textwrap.wrap(tx,width=64)
    for j,ln in enumerate(wr): dr.text((110,yy+j*26),ln,font=F(17,bold=(j==0)),fill=CREAM)
    yy+=26*len(wr)+12
y+=320

# Top 6
dr.text((44,y),'🏆 LOS PUNTEROS',font=FB(28),fill=GOLDB); y+=48
for i,r in enumerate(d['rows'][:6]):
    lead=i==0
    dr.rounded_rectangle([40,y,W-40,y+54],radius=12,fill=(GOLD if lead else CARD2),outline=GOLD,width=2)
    col=INK if lead else WHITE
    mc=(GOLDB,(214,214,214),(205,127,50))[i] if i<3 else CARD
    dr.ellipse([60,y+11,92,y+43],fill=mc,outline=INK,width=2); dr.text((76,y+16),str(i+1),font=FB(20),fill=INK,anchor='ma')
    dr.text((110,y+8),av(r['nm']),font=F(22),fill=col)
    dr.text((150,y+13),r['nm']+(' 🏍️🔥' if r['nm']=='Gerundio' else ''),font=FB(23),fill=col)
    dr.text((W-210,y+17),'Casa '+str(r['casa']),font=F(17),fill=(INK if lead else GOLDB))
    dr.text((W-64,y+10),str(r['total']),font=FB(28),fill=col,anchor='ra'); y+=64

# Fondo de la tabla (las del cerdo)
y+=10
dr.text((44,y),'🐷 LA ZONA DEL CERDO',font=FB(28),fill=RED); y+=48
for r in d['rows'][-3:]:
    isLast=r==d['rows'][-1]
    dr.rounded_rectangle([40,y,W-40,y+54],radius=12,fill=(64,30,28) if isLast else CARD2,outline=RED,width=2)
    dr.text((64,y+8),av(r['nm']),font=F(22),fill=WHITE)
    dr.text((104,y+13),r['nm']+(' 🐷 ¡el cerdo!' if isLast else ''),font=FB(22),fill=(255,205,196) if isLast else WHITE)
    dr.text((W-210,y+17),'Casa '+str(r['casa']),font=F(16),fill=GOLDB)
    dr.text((W-64,y+12),str(r['total']),font=FB(24),fill=WHITE,anchor='ra'); y+=62

y+=4
dr.rounded_rectangle([40,y,W-40,y+70],radius=14,fill=BG2,outline=GREEN,width=2)
dr.text((W//2,y+12),'🐷 Cerdiño: Shakira y Doña Flavia, vayan separando para el marrano.',font=F(18),fill=CREAM,anchor='ma')
dr.text((W//2,y+42),'🦅 MFito: Yo les daría consejos... pero para qué, si igual pierden.',font=F(18),fill=CREAM,anchor='ma')
y+=84
dr.text((W//2,y),'🦅 MF Group · 🐷 Unión Porcícola · 🟣 INPLUX',font=FB(20),fill=GOLDB,anchor='ma')
dr.text((W//2,H-44),'pollamundialnatillera.vercel.app',font=FB(19),fill=GOLD,anchor='ma')
img.save('/tmp/boletin-mascotas.png'); print('OK',img.size)

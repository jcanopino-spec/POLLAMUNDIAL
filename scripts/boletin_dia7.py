from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, json, textwrap
d = json.load(open('/tmp/resumen.json'))
INK=(15,13,10); BG2=(30,26,18); GOLD=(201,162,39); GOLDB=(247,216,104); CREAM=(247,240,224); WHITE=(255,255,255); GREEN=(74,200,130); RED=(228,92,80); CARD=(40,35,26); CARD2=(52,46,34); COLY=(252,209,22); COLB=(0,56,168); COLR=(206,17,38)
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
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(20+t*12),int(17+t*9),int(12+t*6)))
# franja tricolor superior
for i,(c,h0,hh) in enumerate([(COLY,30,26),(COLB,56,14),(COLR,70,14)]):
    dr.rectangle([28,h0,W-28,h0+hh],fill=c)
glow=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(glow).ellipse([W//2-560,-360,W//2+560,260],fill=(201,162,39,38))
img=Image.alpha_composite(img.convert('RGBA'),glow).convert('RGB'); dr=ImageDraw.Draw(img)
dr.rectangle([10,10,W-10,H-10],outline=GOLD,width=5)

# Bonny + Oscarito (redactores) — Bonny grande, etiqueta
try:
    bg=Image.open('/Users/jacp/mundial2026-simulador/public/stadiums/new_york.jpg').convert('RGB').resize((W,300)).filter(ImageFilter.GaussianBlur(7))
    img.paste(bg,(0,96)); reg=img.crop((0,96,W,396)).convert('RGBA'); ov=Image.new('RGBA',(W,300),(15,13,10,160)); img.paste(Image.alpha_composite(reg,ov).convert('RGB'),(0,96))
except Exception as e: print('bg',e)
bn=Image.open('/tmp/bonny-orig.png').convert('RGBA') if os.path.exists('/tmp/bonny-orig.png') else None
if bn:
    bh=270; bw=int(bn.width*bh/bn.height); bn=bn.resize((bw,bh)); img.paste(bn,(W-bw-18,108),bn); ImageDraw.Draw(img).rectangle([W-bw-18,108,W-18,108+bh],outline=GOLDB,width=3)
dr=ImageDraw.Draw(img)
dr.text((44,108),'POLLA DE ALAMEDA',font=FB(30),fill=GOLDB,stroke_width=2,stroke_fill=INK)
dr.text((44,152),'BOLETÍN',font=FB(74),fill=WHITE,stroke_width=2,stroke_fill=INK)
dr.text((44,226),'TRICOLOR',font=FB(74),fill=COLY,stroke_width=2,stroke_fill=INK)
dr.text((46,308),d['fecha'],font=F(22),fill=CREAM,stroke_width=2,stroke_fill=INK)
dr.text((46,342),'Redactan: BONNY 🐕 & OSCARITO 🍾',font=FB(20),fill=GOLDB,stroke_width=2,stroke_fill=INK)

y=420
# Crónica con humor (el pajarraco no vino)
dr.rounded_rectangle([40,y,W-40,y+250],radius=18,fill=CARD,outline=GOLDB,width=2)
dr.text((64,y+16),'🐕🍾 LA CRÓNICA DEL DÍA:',font=FB(24),fill=GOLDB)
cron=('¡COLOMBIA GANÓ 1-3 y el parche se reunió COMPLETO a gozarla! Solo faltó UNA presencia: '
 'la familia del pajarraco. A Don Instantes y Doña Julia les dio MIEDO traer a Me Frito al parche... '
 'con tanto bullying acumulado, el pobre cóndor de Temu se habría ido en lágrimas. '
 'Por eso hoy escribimos Bonny (con el whisky del amo) y Oscarito (con el aguardiente). ¡Salud, mejor sin el ave!')
for j,ln in enumerate(textwrap.wrap(cron,width=70)):
    dr.text((64,y+56+j*28),ln,font=F(18,bold=(j==0)),fill=CREAM)
y+=270

# Resultados
dr.text((44,y),'RESULTADOS DE HOY',font=FB(28),fill=GOLDB); y+=48
for p in d['partidos']:
    col = p['exactos']
    isCol = 'Colombia' in (p['h'],p['a'])
    dr.rounded_rectangle([40,y,W-40,y+82],radius=14,fill=(CARD2 if isCol else CARD),outline=(COLY if isCol else GOLD),width=(3 if isCol else 2))
    dr.text((64,y+12),p['h'],font=FB(25),fill=WHITE)
    dr.rounded_rectangle([W//2-58,y+10,W//2+58,y+48],radius=10,fill=(COLY if isCol else GOLDB))
    dr.text((W//2,y+14),str(p['hs'])+' - '+str(p['as']),font=FB(26),fill=INK,anchor='ma')
    dr.text((W-64,y+12),p['a'],font=FB(25),fill=WHITE,anchor='ra')
    ex=('🎯 CLAVARON: '+', '.join(col)) if col else 'nadie clavó (como el pajarraco siempre)'
    dr.text((64,y+54),ex[:78],font=F(15,bold=False),fill=(GREEN if col else RED)); y+=94

# Tabla top 6
y+=6
dr.text((44,y),'🏆 TABLA DE POSICIONES (top 6)',font=FB(26),fill=GOLDB); y+=46
for i,r in enumerate(d['rows'][:6]):
    lead=i==0
    dr.rounded_rectangle([40,y,W-40,y+54],radius=12,fill=(GOLD if lead else CARD2),outline=GOLD,width=2)
    col=INK if lead else WHITE
    mc=(GOLDB,(214,214,214),(205,127,50))[i] if i<3 else CARD
    dr.ellipse([60,y+11,92,y+43],fill=mc,outline=INK,width=2); dr.text((76,y+16),str(i+1),font=FB(20),fill=INK,anchor='ma')
    dr.text((110,y+8),av(r['nm']),font=F(22),fill=col)
    dr.text((150,y+13),r['nm'],font=FB(23),fill=col)
    dr.text((W-210,y+17),'Casa '+str(r['casa']),font=F(17),fill=(INK if lead else GOLDB))
    dr.text((W-64,y+10),str(r['total']),font=FB(28),fill=col,anchor='ra'); y+=64
last=d['rows'][-1]; y+=2
dr.rounded_rectangle([40,y,W-40,y+52],radius=12,fill=(64,32,30),outline=RED,width=2)
dr.text((64,y+13),'🐷 COLERO (va por el cerdo):',font=FB(22),fill=(255,205,196))
dr.text((W-64,y+13),last['nm']+' · '+str(last['total']),font=FB(22),fill=WHITE,anchor='ra'); y+=70
dr.text((W//2,y),'¡VAMOS COLOMBIA! El parche unido... menos el ave miedosa 🦅🚫',font=FB(22),fill=COLY,anchor='ma')
dr.text((W//2,H-44),'pollamundialnatillera.vercel.app  ·  patrocina MF GROUP',font=FB(19),fill=GOLD,anchor='ma')
img.save('/tmp/boletin-dia7.png'); print('OK',img.size)

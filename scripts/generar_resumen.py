# Boletín diario de la Polla de Alameda · MFito protagonista + crónica chistosa
# + sello "vigilado por DIAN/Fiscalía" con logos reales. Sin emojis (Pillow los dibuja como cuadros).
# Datos en /tmp/resumen.json. Uso: python3 scripts/generar_resumen.py
from PIL import Image, ImageDraw, ImageFont
import json, os, re, textwrap

d = json.load(open('/tmp/resumen.json'))
ES = {'Mexico':'México','South Africa':'Sudáfrica','Korea Republic':'Corea del Sur','Czechia':'Chequia',
      'Canada':'Canadá','Brazil':'Brasil','Argentina':'Argentina','Spain':'España','France':'Francia','Portugal':'Portugal'}
def es(t): return ES.get(t, t)
# quita emojis/símbolos pero conserva acentos y ñ
EMOJI = re.compile('[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF←-⇿⬀-⯿️]')
def clean(s): return EMOJI.sub('', s).replace('  ',' ').strip()

# ---- Paleta (negro-dorado MF Group, mejor combinada) ----
BG1=(24,21,16); BG2=(13,11,8); CARD=(38,34,26); CARD2=(46,41,31)
GOLD=(201,162,39); GOLDB=(245,211,99); CREAM=(245,238,222); WHITE=(255,255,255)
GREEN=(74,200,130); RED=(228,92,80); NAVY=(28,40,90)

def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'
    return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'
    return ImageFont.truetype(p,sz) if os.path.exists(p) else F(sz)

# ---- Narración chistosa (sin emojis) ----
def narrar(d):
    t=[f"Día {d['dia']} del Mundial y ya hay sufrimiento en Alameda."]
    genios=[]
    for p in d['partidos']:
        genios += p['exactos']
    uniq=list(dict.fromkeys(genios))
    if uniq:
        t.append("Los brujos que CLAVARON el marcador exacto: " + ", ".join(uniq) + ". Esos vieron el futuro.")
    if d['nadieExacto']:
        t.append("Y hubo partido que NADIE clavó: todos de una pa'l cerdo en ese.")
    lider=d['rows'][0]
    t.append(f"Manda en la mesa {lider['nm']} (casa {lider['casa']}) con {lider['total']} puntos. Que lo disfrute mientras dure.")
    col=d['rows'][-1]
    t.append(f"Y el farol de la cola es {col['nm']} con {col['total']} puntos: vaya destapando el guaro.")
    return clean(' '.join(t))

W,H=1080,1610
img=Image.new('RGB',(W,H),BG1); dr=ImageDraw.Draw(img)
# fondo: degradado + halo dorado superior
for y in range(H):
    tt=y/H; dr.line([(0,y),(W,y)],fill=(int(BG1[0]*(1-tt)+BG2[0]*tt),int(BG1[1]*(1-tt)+BG2[1]*tt),int(BG1[2]*(1-tt)+BG2[2]*tt)))
glow=Image.new('RGBA',(W,H),(0,0,0,0)); gd=ImageDraw.Draw(glow)
gd.ellipse([W//2-520,-340,W//2+520,260],fill=(201,162,39,46))
img=Image.alpha_composite(img.convert('RGBA'),glow).convert('RGB'); dr=ImageDraw.Draw(img)
# marco doble dorado
dr.rectangle([12,12,W-12,H-12],outline=GOLD,width=4)
dr.rectangle([22,22,W-22,H-22],outline=(80,66,24),width=1)

# ---- MFito protagonista (grande, derecha) ----
mf=Image.open('/tmp/mfito.png').convert('RGBA')
mfh=600; mfw=int(mf.width*mfh/mf.height); mf=mf.resize((mfw,mfh))
img.paste(mf,(W-mfw+10,40),mf)

# ---- Cabecera ----
dr.text((54,58),'POLLA DE ALAMEDA',font=FB(30),fill=GOLD)
dr.text((54,100),'BOLETÍN',font=FB(76),fill=WHITE)
dr.text((54,176),f"DÍA {d['dia']}",font=FB(76),fill=GOLDB)
dr.text((56,262),d['fecha'],font=F(22),fill=CREAM)
# chip MFito
dr.rounded_rectangle([56,296,300,338],radius=21,fill=GOLD)
dr.text((178,303),'NARRA: MFITO',font=FB(20),fill=BG1,anchor='ma')

# ---- Crónica ----
y=360
nar=narrar(d)
lines=textwrap.wrap(nar,width=82)[:6]
boxh=58+len(lines)*28
dr.rounded_rectangle([46,y,W-46,y+boxh],radius=20,fill=CARD,outline=GOLD,width=2)
dr.text((70,y+16),'LA CRÓNICA DEL DÍA',font=FB(24),fill=GOLDB)
yy=y+56
for ln in lines:
    dr.text((70,yy),ln,font=F(20),fill=CREAM); yy+=28
y+=boxh+22

# ---- Resultados ----
dr.text((54,y),'RESULTADOS DE HOY',font=FB(30),fill=GOLDB); y+=50
for p in d['partidos']:
    dr.rounded_rectangle([46,y,W-46,y+90],radius=16,fill=CARD,outline=GOLD,width=2)
    dr.text((70,y+13),es(p['h']),font=FB(28),fill=WHITE)
    dr.rounded_rectangle([W//2-66,y+10,W//2+66,y+52],radius=12,fill=GOLDB)
    dr.text((W//2,y+14),f"{p['hs']} - {p['as']}",font=FB(30),fill=BG1,anchor='ma')
    dr.text((W-70,y+13),es(p['a']),font=FB(28),fill=WHITE,anchor='ra')
    extra = clean(('EXACTO: '+', '.join(p['exactos'])) if p['exactos'] else ('Goles: '+(p['sc'] or '')))
    dr.text((70,y+58),extra[:80],font=F(17),fill=(GREEN if p['exactos'] else CREAM)); y+=102

# ---- Punteros ----
y+=8
dr.text((54,y),'LOS PUNTEROS',font=FB(30),fill=GOLDB); y+=48
pos_lbl=['1','2','3','4','5']
for i,r in enumerate(d['rows'][:5]):
    lead=i==0
    dr.rounded_rectangle([46,y,W-46,y+56],radius=12,fill=(GOLD if lead else CARD2),outline=GOLD,width=2)
    col=BG1 if lead else WHITE
    # medalla circular
    mc=(GOLDB,(214,214,214),(205,127,50))[i] if i<3 else CARD
    dr.ellipse([64,y+12,96,y+44],fill=mc,outline=BG1,width=2)
    dr.text((80,y+17),pos_lbl[i],font=FB(22),fill=BG1,anchor='ma')
    dr.text((116,y+14),r['nm'],font=FB(25),fill=col)
    dr.text((W-210,y+18),f"Casa {r['casa']}",font=F(18),fill=(BG1 if lead else GOLDB))
    dr.text((W-66,y+9),f"{r['total']}",font=FB(32),fill=col,anchor='ra')
    dr.text((W-66,y+41),'pts',font=F(12),fill=(BG1 if lead else GOLDB),anchor='ra'); y+=66

last=d['rows'][-1]; y+=4
dr.rounded_rectangle([46,y,W-46,y+54],radius=12,fill=(64,32,30),outline=RED,width=2)
dr.text((70,y+14),'COLERO (va por el cerdo):',font=FB(22),fill=(255,205,196))
dr.text((W-66,y+14),f"{last['nm']} · {last['total']} pts",font=FB(23),fill=WHITE,anchor='ra'); y+=74

# ---- Sello VIGILADO con logos reales ----
sh=158
dr.rounded_rectangle([46,y,W-46,y+sh],radius=16,fill=CARD,outline=GOLDB,width=2)
dr.text((W//2,y+14),'ESTA POLLA ESTÁ VIGILADA POR',font=FB(26),fill=RED,anchor='ma')
def chip(logo_path, cx, cyt, cw, chh=92):
    dr.rounded_rectangle([cx-cw//2,cyt,cx+cw//2,cyt+chh],radius=12,fill=WHITE,outline=BG1,width=2)
    lg=Image.open(logo_path).convert('RGBA')
    maxw,maxh=cw-22,chh-18
    sc=min(maxw/lg.width,maxh/lg.height); lg=lg.resize((max(1,int(lg.width*sc)),max(1,int(lg.height*sc))))
    img.paste(lg,(cx-lg.width//2,cyt+(chh-lg.height)//2),lg)
chy=y+52
chip('/tmp/dian.jpeg', W//2-300, chy, 230)
chip('/tmp/fiscalia.png', W//2-60, chy, 100)
# gallina con abogados
dr.rounded_rectangle([W//2+30,chy,W//2+300,chy+92],radius=12,fill=GOLD)
dr.text((W//2+165,chy+22),'LA GALLINA',font=FB(24),fill=BG1,anchor='ma')
dr.text((W//2+165,chy+52),'CON ABOGADOS',font=FB(18),fill=BG1,anchor='ma')
y+=sh+6
dr.text((W//2,y),'(el que no pague el guaro, declara renta)',font=F(17,bold=False),fill=CREAM,anchor='ma'); y+=36

# ---- Pie ----
dr.text((W//2,y+4),'Mascota oficial: MFito · MF GROUP',font=FB(20),fill=GOLDB,anchor='ma')
dr.text((W//2,H-44),'pollamundialnatillera.vercel.app',font=FB(22),fill=GOLD,anchor='ma')

img.save('public/resumen-dia.png'); img.save('/tmp/resumen-dia.png')
print('OK', img.size)

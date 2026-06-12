# Afiche diario de la Polla de Alameda con MFito + narración chistosa + sello "vigilado".
# Datos en /tmp/resumen.json (exportados con node). Uso: python3 scripts/generar_resumen.py
from PIL import Image, ImageDraw, ImageFont
import json, os, textwrap

d = json.load(open('/tmp/resumen.json'))
ES = {'Mexico':'México','South Africa':'Sudáfrica','Korea Republic':'Corea del Sur','Czechia':'Chequia',
      'Canada':'Canadá','Brazil':'Brasil','Argentina':'Argentina','Spain':'España','France':'Francia'}
def es(t): return ES.get(t, t)

INK=(20,18,15); GOLD=(212,175,55); GOLD2=(247,213,107); CREAM=(251,244,230); WHITE=(255,255,255); RED=(225,80,70); GREEN=(60,190,120)
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'
    return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'
    return ImageFont.truetype(p,sz) if os.path.exists(p) else F(sz)

# ---------- Narración chistosa automática ----------
def narrar(d):
    t=[]
    np=len(d['partidos'])
    t.append(f"Día {d['dia']} del Mundial y ya hay sufrimiento en Alameda 🍿.")
    # exactos
    genios=[]
    for p in d['partidos']:
        if p['exactos']:
            genios += p['exactos']
    if genios:
        uniq=list(dict.fromkeys(genios))
        t.append(f"Los brujos que CLAVARON marcador: {', '.join(uniq)} 🎯🔥 — esos vieron el futuro.")
    if d['nadieExacto']:
        t.append("Y hubo partido que NADIE clavó… todos pa'l cerdo en ese 🐷😂.")
    # líder
    lider=d['rows'][0]
    t.append(f"Manda en la mesa {lider['nm']} (casa {lider['casa']}) con {lider['total']} pts 👑. Disfrútelo mientras dure.")
    # colero
    col=d['rows'][-1]
    t.append(f"Y el farol de la cola es {col['nm']} con {col['total']} pts… vaya destapando el guaro 🐖🍺.")
    return ' '.join(t)

narracion = narrar(d)

W,H=1080,1620
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    tt=y/H; dr.line([(0,y),(W,y)],fill=(int(20+tt*8),int(18+tt*6),int(15+tt*4)))
for i in range(64):
    x=(i*97+50)%W; yy=(i*53+30)%H; s=4+(i%3)*3
    dr.rectangle([x,yy,x+s,yy+s*1.6], fill=GOLD if i%2 else GOLD2)
dr.rectangle([14,14,W-14,H-14], outline=GOLD, width=5)

# MFito arriba derecha
mf=Image.open('/tmp/mfito.png').convert('RGBA')
mfh=540; mfw=int(mf.width*mfh/mf.height); mf=mf.resize((mfw,mfh))
img.paste(mf,(W-mfw-8,28),mf)

dr.text((50,55),'POLLA DE ALAMEDA',font=FB(32),fill=GOLD)
dr.text((50,98),'RESUMEN',font=FB(70),fill=WHITE)
dr.text((50,170),f"DEL DÍA {d['dia']}",font=FB(70),fill=GOLD)
dr.text((52,252),f"🦅 {d['fecha']} · con MFito",font=F(22),fill=CREAM)

# Narración chistosa (caja)
y=330
dr.rounded_rectangle([46,y,W-46,y+196],radius=18,fill=(34,30,24),outline=GOLD,width=2)
dr.text((68,y+16),'🎙️ LA CRÓNICA DE MFITO',font=FB(24),fill=GOLD2)
yy=y+58
for line in textwrap.wrap(narracion, width=74)[:6]:
    dr.text((68,yy),line,font=F(20),fill=CREAM); yy+=27
y+=216

# Resultados
dr.text((50,y),'⚽ RESULTADOS',font=FB(30),fill=GOLD2); y+=50
for p in d['partidos']:
    dr.rounded_rectangle([46,y,W-46,y+92],radius=16,fill=(34,30,24),outline=GOLD,width=2)
    dr.text((68,y+12),es(p['h']),font=FB(28),fill=WHITE)
    dr.text((W//2,y+10),f"{p['hs']} - {p['as']}",font=FB(34),fill=GOLD2,anchor='ma')
    dr.text((W-68,y+12),es(p['a']),font=FB(28),fill=WHITE,anchor='ra')
    extra = ('🎯 '+', '.join(p['exactos'])) if p['exactos'] else ('⚽ '+(p['sc'] or ''))
    dr.text((68,y+56),extra[:74],font=F(17),fill=(GREEN if p['exactos'] else CREAM)); y+=104

# Tabla top 5
y+=8
dr.text((50,y),'🏆 LOS PUNTEROS',font=FB(30),fill=GOLD2); y+=48
medals=['🥇','🥈','🥉']
for i,r in enumerate(d['rows'][:5]):
    lead=i==0
    dr.rounded_rectangle([46,y,W-46,y+56],radius=12,fill=(GOLD if lead else (40,36,28)),outline=GOLD,width=2)
    col=INK if lead else WHITE
    dr.text((70,y+13),medals[i] if i<3 else str(i+1),font=FB(26),fill=col)
    dr.text((142,y+13),r['nm'],font=FB(25),fill=col)
    dr.text((W-220,y+17),f"Casa {r['casa']}",font=F(18),fill=(INK if lead else GOLD2))
    dr.text((W-64,y+9),f"{r['total']}",font=FB(32),fill=col,anchor='ra')
    dr.text((W-64,y+40),'pts',font=F(12),fill=(INK if lead else GOLD2),anchor='ra'); y+=66

last=d['rows'][-1]; y+=4
dr.rounded_rectangle([46,y,W-46,y+54],radius=12,fill=(60,30,28),outline=RED,width=2)
dr.text((70,y+14),'🐷 COLERO:',font=FB(24),fill=(255,200,190))
dr.text((W-64,y+14),f"{last['nm']} · {last['total']} pts",font=FB(24),fill=WHITE,anchor='ra'); y+=74

# Sello VIGILADO (chiste)
dr.rounded_rectangle([46,y,W-46,y+92],radius=14,fill=(28,26,20),outline=GOLD2,width=2)
dr.text((W//2,y+14),'⚠️ ESTA POLLA ESTÁ VIGILADA POR ⚠️',font=FB(22),fill=RED,anchor='ma')
dr.text((W//2,y+48),'👁️ DIAN · 🔍 FISCALÍA · 🐔 LA GALLINA CON ABOGADOS',font=FB(20),fill=GOLD2,anchor='ma')
dr.text((W//2,y+74),'(el que no pague el guaro, declara renta 😂)',font=F(15),fill=CREAM,anchor='ma'); y+=104

# Pie
dr.text((W//2,y+4),'🦅 Mascota oficial: MFito · MF GROUP',font=FB(20),fill=GOLD2,anchor='ma')
dr.text((W//2,y+32),'Cortesía de Somos Instantes y Doña Julia 🙌',font=F(18),fill=CREAM,anchor='ma')
dr.text((W//2,H-40),'pollamundialnatillera.vercel.app',font=FB(20),fill=GOLD,anchor='ma')

img.save('public/resumen-dia.png'); img.save('/tmp/resumen-dia.png')
print('OK', img.size)

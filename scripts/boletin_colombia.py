from PIL import Image, ImageDraw, ImageFont
import os, textwrap

INK=(11,20,40); NAVY=(16,30,58); NAVY2=(22,40,74); GREEN=(40,140,60); RED=(150,40,40)
GOLD=(214,175,55); GOLDB=(247,216,104); CREAM=(245,238,224); WHITE=(255,255,255)
BLUE=(40,90,180); BLUEH=(52,120,220); COLY=(252,209,22); COLB=(0,56,147); COLR=(206,17,38); PIG=(225,150,170)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

W,H=1200,2520
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
# fondo tricolor difuminado: amarillo arriba, azul medio, rojo abajo + cancha
for y in range(H):
    t=y/H
    if t<0.30: c=(int(250-t*60),int(200-t*120),int(40))
    elif t<0.45: c=(int(20+(t-0.30)*60),int(60+(t-0.30)*120),int(120+(t-0.30)*120))
    else: c=(int(28+(t-0.45)*20),int(72+(t-0.45)*60),int(40))
    dr.line([(0,y),(W,y)],fill=c)
for i in range(120):
    x=(i*113+30)%W; yy=(i*71+20)%H; s=6+(i%3)*4
    cols=[COLR,GREEN,COLB,GOLDB,WHITE]
    dr.rectangle([x,yy,x+s,yy+int(s*1.4)],fill=cols[i%5])

def head(path,x,size,y):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,y),m)
head('public/cerdino-head.png', 40, 150, 38)
head('public/mfito-head.png', 175, 150, 38)
dr.text((W-40,38),'POLLA DE ALAMEDA',font=FB(30),fill=COLB,anchor='ra',stroke_width=2,stroke_fill=WHITE)
dr.text((W-40,84),'BOLETÍN',font=FB(72),fill=WHITE,anchor='ra',stroke_width=3,stroke_fill=INK)
dr.text((W-40,158),'🇨🇴 ¡DÍA DE COLOMBIA! 🇨🇴',font=FB(40),fill=COLR,anchor='ra',stroke_width=2,stroke_fill=WHITE)
dr.text((W-40,212),'CORTE 27-JUN · HOY CIERRA LA FASE DE GRUPOS',font=F(19),fill=INK,anchor='ra',stroke_width=1,stroke_fill=WHITE)

dr.rounded_rectangle([30,288,W-30,H-30],radius=24,outline=GREEN,width=6)
dr.rounded_rectangle([34,292,W-34,H-34],radius=22,outline=COLR,width=3)

# ===== 1) CERDO DE ORO: DON RSU (de los primeros) =====
y=316
dr.rounded_rectangle([60,y,W-60,y+340],radius=16,fill=(70,30,40),outline=GOLDB,width=3)
dr.rounded_rectangle([60,y,W-60,y+50],radius=16,fill=PIG)
dr.text((84,y+10),'🏆🐖 PREMIO "CERDO DE ORO" DE LA SEMANA',font=FB(25),fill=(70,20,40))
rsu=[
 ('🥇','¡Y el galardón es para… DON RSU! Firme, sólido, INAMOVIBLE… de ÚLTIMO con 93 pts. Un monumento a la constancia 🗿.'),
 ('🎯','Dato histórico: lleva 60 PRONÓSTICOS y CERO EXACTOS. ¡Ni de chiripa, ni con suerte, ni cerrando los ojos! Puntería de campeón… al revés.'),
 ('🐷','Pero es el colero MÁS RENTABLE del parche: con la porcícola que tiene, le sale más BARATO agarrar un marrano del corral y pagarle al grupo que ponerse a estudiar fútbol 😂.'),
 ('💬','Cerdiño: "Colega, usted no pierde plata… pierde INVENTARIO". MFito: "60 tiros y ni uno al blanco, ¡eso ya es talento!" 🦅'),
]
yy=y+62
for em,ln in rsu:
    dr.text((84,yy),em,font=FB(23),fill=GOLDB)
    ws=textwrap.wrap(ln,width=72)
    for j,w in enumerate(ws): dr.text((124,yy+j*22),w,font=F(16,bold=(j==0)),fill=CREAM)
    yy+=22*len(ws)+9
y+=360

# ===== 2) ASÍ ESTUVO AYER =====
dr.rounded_rectangle([60,y,W-60,y+460],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.rounded_rectangle([60,y,W-60,y+46],radius=16,fill=GREEN)
dr.text((84,y+9),'📅 LO QUE PASÓ AYER (26-JUN · 6 PARTIDOS):',font=FB(22),fill=WHITE)
games=[
 ('🇸🇳','Senegal 5-0 Irak','💀 Manita senegalesa. Nadie olió semejante goliza.'),
 ('🇫🇷','Noruega 1-4 Francia','💀 ¡HAT-TRICK de Dembélé! Aplastó hasta a Haaland. Nadie clavó.'),
 ('🇪🇸','Uruguay 0-1 España','🎯 Baena al 42ʼ. ÚNICO exacto: Somos instantes 👏.'),
 ('🇧🇪','N.Zelanda 1-5 Bélgica','💀 Trossard doblete + De Bruyne y Lukaku. Otra goleada sin dueño.'),
 ('🇪🇬','Egipto 1-1 Irán','🎯 ¡4 clavaron el 1-1! Matias, Yuyeimi, Andresito y Maíz.'),
 ('🇸🇦','Cabo Verde 0-0 A.Saudí','😴 Empate a cero pa dormir. Nadie le apostó al bostezo.'),
]
ry=y+56
for fg,tit,hit in games:
    dr.rounded_rectangle([78,ry,W-78,ry+58],radius=10,fill=NAVY2,outline=GOLD,width=1)
    dr.text((94,ry+10),fg,font=FB(26),fill=WHITE)
    dr.text((146,ry+8),tit,font=FB(21),fill=GOLDB)
    dr.text((146,ry+34),hit,font=F(15,bold=False),fill=(190,235,200))
    ry+=66
y+=480

# ===== 3) TABLA =====
dr.rounded_rectangle([60,y,W-60,y+330],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((84,y+12),'🏆 TABLA DEL CERDO (TOP 5)',font=FB(26),fill=WHITE)
rows=[('Gerundio',151),('Yuyeimi',146),('Maíz',142),('El mayordomo',139),('Matias y Chente',136)]
medal=[GOLDB,(220,220,220),(205,127,50)]
ry=y+54
for i,(n,p) in enumerate(rows):
    bar=medal[i] if i<3 else BLUEH; dark=i<3
    extra=' 👑' if i==0 else ''
    dr.rounded_rectangle([80,ry,W-80,ry+40],radius=10,fill=bar,outline=WHITE,width=2)
    dr.ellipse([90,ry+5,120,ry+35],fill=WHITE,outline=INK,width=2); dr.text((105,ry+9),str(i+1),font=FB(20),fill=INK,anchor='ma')
    dr.text((138,ry+7),n+extra,font=FB(22),fill=(INK if dark else WHITE))
    dr.text((W-110,ry+3),str(p),font=FB(26),fill=(INK if dark else WHITE),anchor='ma')
    dr.text((W-110,ry+33),'pts',font=F(11),fill=(INK if dark else CREAM),anchor='ma')
    ry+=46
dr.text((84,ry+8),'🐷 Colero: DON RSU con 93 (ver Cerdo de Oro arriba ☝️).',font=F(16),fill=(255,205,195))
dr.text((84,ry+34),'😬 Lo acompañan: Shakira 96 y Estupiñán 102. ¡Zona de marrano!',font=F(16),fill=(255,205,195))
y+=350

# ===== 4) HOY DÍA DE COLOMBIA =====
dr.rounded_rectangle([60,y,W-60,y+210],radius=16,fill=COLB,outline=GOLDB,width=3)
dr.rectangle([60,y,W-60,y+10],fill=COLY)
dr.text((84,y+22),'🇨🇴 ¡HOY JUEGA LA TRICOLOR! 🇨🇴',font=FB(30),fill=WHITE)
dr.text((84,y+64),'⚽ COLOMBIA vs PORTUGAL 🇵🇹 — 6:30 PM',font=FB(26),fill=COLY)
dr.text((84,y+100),'¡El partidazo del cierre de grupos! A pronosticar con el corazón… pero con cabeza 🧠.',font=F(17,bold=False),fill=CREAM)
dr.line([84,y+132,W-84,y+132],fill=GOLDB,width=2)
dr.text((84,y+142),'También HOY cierra todo:',font=FB(18),fill=WHITE)
dr.text((84,y+170),'🏴 Panamá-Inglaterra · 🇭🇷 Croacia-Ghana · 🇨🇩 Congo-Uzbekistán',font=F(16),fill=CREAM)
dr.text((84,y+194),'🇩🇿 Argelia-Austria · 🇯🇴 Jordania-Argentina',font=F(16),fill=CREAM)
y+=230

# ===== Pie =====
dr.rounded_rectangle([60,y,W-60,y+54],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((W//2,y+8),'🔒 La app cierra cada partido al pitazo y ¡ya actualiza EN VIVO!',font=FB(18),fill=GOLDB,anchor='ma')
dr.text((W//2,y+32),'🦅 MF GROUP · 🐷 UNIÓN PORCÍCOLA · 🟣 INPLUX',font=FB(18),fill=CREAM,anchor='ma')
y+=64
dr.rounded_rectangle([W//2-220,y,W//2+220,y+42],radius=14,fill=NAVY2,outline=GOLD,width=2)
dr.text((W//2,y+9),'pollamundialnatillera.vercel.app',font=FB(20),fill=WHITE,anchor='ma')

img.save('/tmp/boletin-colombia.png'); print('OK',img.size)

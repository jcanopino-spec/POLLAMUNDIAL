from PIL import Image, ImageDraw, ImageFont
import os, textwrap

INK=(11,20,40); NAVY=(16,30,58); NAVY2=(22,40,74); GREEN=(40,140,60); RED=(150,40,40)
GOLD=(214,175,55); GOLDB=(247,216,104); CREAM=(245,238,224); WHITE=(255,255,255)
BLUE=(40,90,180); BLUEH=(52,120,220); MEXG=(0,104,71); SKY=(120,180,235)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

W,H=1200,2420
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
# fondo: cielo de vuelo arriba, cancha abajo
for y in range(H):
    t=y/H
    if t<0.45: c=(int(70+t*120),int(110+t*120),int(170+t*70))
    else: c=(int(30+(t-0.45)*20),int(70+(t-0.45)*60),int(40))
    dr.line([(0,y),(W,y)],fill=c)
# nubes
for cx,cy,r in [(180,150,60),(260,170,80),(950,120,70),(1040,150,55),(620,90,50)]:
    dr.ellipse([cx-r,cy-r//2,cx+r,cy+r//2],fill=(255,255,255,80))
for i in range(120):
    x=(i*113+30)%W; yy=(i*71+20)%H; s=6+(i%3)*4
    cols=[(225,56,47),(27,145,80),(52,71,214),GOLDB,WHITE]
    dr.rectangle([x,yy,x+s,yy+int(s*1.4)],fill=cols[i%5])

def head(path,x,size,y):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,y),m)
head('public/cerdino-head.png', 40, 150, 38)
head('public/mfito-head.png', 175, 150, 38)
dr.text((W-40,38),'POLLA DE ALAMEDA',font=FB(30),fill=INK,anchor='ra',stroke_width=2,stroke_fill=WHITE)
dr.text((W-40,84),'BOLETÍN',font=FB(72),fill=WHITE,anchor='ra',stroke_width=3,stroke_fill=INK)
dr.text((W-40,158),'EDICIÓN RESACA ✈️🍸',font=FB(38),fill=RED,anchor='ra',stroke_width=2,stroke_fill=WHITE)
dr.text((W-40,210),'CORTE 24-JUN · A BORDO RUMBO A GUADALAJARA 🇲🇽',font=F(19),fill=INK,anchor='ra',stroke_width=1,stroke_fill=WHITE)

dr.rounded_rectangle([30,288,W-30,H-30],radius=24,outline=GREEN,width=6)
dr.rounded_rectangle([34,292,W-34,H-34],radius=22,outline=RED,width=3)

# ===== PANEL CRÓNICA DEL PARCHE =====
y=316
dr.rounded_rectangle([60,y,W-60,y+330],radius=16,fill=NAVY,outline=GOLDB,width=2)
dr.rounded_rectangle([60,y,W-60,y+46],radius=16,fill=RED)
dr.text((84,y+9),'📡 REPORTE DESDE EL VUELO CHÁRTER:',font=FB(25),fill=WHITE)
cron=[
 ('✈️','Les escriben Edison, JuanMa y Jaime desde el charter a Guadalajara. Veníamos de noche de TEQUILA y la cabeza es un bombo 🍸🤕.'),
 ('🚿','Aclaración higiénica: Edison y JuanMa NI SE BAÑARON (los iba a dejar el avión). El único que olió a jabón fui yo. Saquen sus conclusiones 😷.'),
 ('🩺','¡FICHAJE BOMBA! En el vuelo conocimos un GINECÓLOGO que se quiere unir al parche. Dice que viene a DIAGNOSTICAR a MFito y a TODO el grupo 😳🦅.'),
 ('🐷','Cerdiño: "Doctor, al que va de colero revíselo bien, que ese ya está pa cuidados intensivos".'),
]
yy=y+58
for em,ln in cron:
    dr.text((84,yy),em,font=FB(24),fill=GOLDB)
    ws=textwrap.wrap(ln,width=70)
    for j,w in enumerate(ws): dr.text((128,yy+j*23),w,font=F(17,bold=(j==0)),fill=CREAM)
    yy+=23*len(ws)+10
y+=350

# ===== ASÍ ESTUVO AYER =====
dr.rounded_rectangle([60,y,W-60,y+560],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.rounded_rectangle([60,y,W-60,y+46],radius=16,fill=GREEN)
dr.text((84,y+9),'📅 LO QUE PASÓ AYER (23-JUN):',font=FB(25),fill=WHITE)
games=[
 ('🇵🇹','PORTUGAL 5-0 UZBEKISTÁN','Doblete de CR7, Mendes, autogol y Leão. Manita lusa.','💀 NADIE clavó el 5-0 (¿quién iba a pensar semejante goliza?). 29 salvaron resultado.'),
 ('🏴','INGLATERRA 0-0 GHANA','Pa dormir. Cero emoción, cero goles, cero gracia.','💀 NADIE le apostó al 0-0 aburridor. Pleno bostezo 🥱.'),
 ('🇵🇦','PANAMÁ 0-1 CROACIA','Budimir al 54ʼ. Croacia con oficio, Panamá con ganas.','🎯 ¡EXACTO ÚNICO: MAÍZ clavó el 0-1! El francotirador 🌽.'),
 ('🇨🇴','COLOMBIA 1-0 CONGO DR','¡GOOOL de Daniel Muñoz al 76ʼ! La Tricolor sufrió pero ganó 🇨🇴.','🎯 3 clavaron el 1-0: Gerundio, Andresito y Somos instantes. ¡Patriotas!'),
]
ry=y+58
for fg,tit,desc,hit in games:
    dr.rounded_rectangle([78,ry,W-78,ry+116],radius=12,fill=NAVY2,outline=GOLD,width=1)
    dr.text((96,ry+12),fg,font=FB(30),fill=WHITE)
    dr.text((152,ry+12),tit,font=FB(23),fill=GOLDB)
    for j,w in enumerate(textwrap.wrap(desc,width=80)): dr.text((96,ry+50+j*22),w,font=F(16,bold=False),fill=CREAM)
    dr.text((96,ry+92),hit,font=F(16),fill=(180,235,190))
    ry+=124
y+=580

# ===== TABLA + DESTACADOS =====
dr.rounded_rectangle([60,y,W-60,y+340],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((84,y+12),'🏆 TABLA DEL CERDO (TOP 6)',font=FB(26),fill=WHITE)
rows=[('Gerundio',113),('Yuyeimi',106),('Martin Fierro',104),('Maíz',104),('El mayordomo',102),('Don Edson',101)]
medal=[GOLDB,(220,220,220),(205,127,50)]
ry=y+54
for i,(n,p) in enumerate(rows):
    bar=medal[i] if i<3 else BLUEH; dark=i<3
    extra=' 👑' if i==0 else (' ✈️' if n=='Don Edson' else (' 🌽' if n=='Maíz' else ''))
    dr.rounded_rectangle([80,ry,W-80,ry+40],radius=10,fill=bar,outline=WHITE,width=2)
    dr.ellipse([90,ry+5,120,ry+35],fill=WHITE,outline=INK,width=2); dr.text((105,ry+9),str(i+1),font=FB(20),fill=INK,anchor='ma')
    dr.text((138,ry+7),n+extra,font=FB(22),fill=(INK if dark else WHITE))
    dr.text((W-110,ry+3),str(p),font=FB(26),fill=(INK if dark else WHITE),anchor='ma')
    dr.text((W-110,ry+33),'pts',font=F(11),fill=(INK if dark else CREAM),anchor='ma')
    ry+=46
dr.text((84,ry+8),'🔥 Cosecha de ayer (+11): Gerundio, Andresito, Maíz y Somos instantes.',font=F(16),fill=GOLDB)
dr.text((84,ry+34),'🐷 Colero: SHAKIRA con 70. ¡La primera paciente del ginecólogo! 🩺',font=F(16),fill=(255,205,195))
y+=360

# ===== HOY JUEGA MÉXICO =====
dr.rounded_rectangle([60,y,W-60,y+230],radius=16,fill=(8,48,32),outline=GOLDB,width=3)
dr.rectangle([60,y,W-60,y+8],fill=MEXG); dr.rectangle([60,y+8,W-60,y+12],fill=WHITE)
dr.text((84,y+22),'🇲🇽 HOY ATERRIZAMOS Y JUEGA MÉXICO',font=FB(28),fill=WHITE)
dr.text((84,y+62),'⚽ CHEQUIA vs MÉXICO 🇲🇽 — 8:00 PM (¡desde Guadalajara!)',font=FB(22),fill=GOLDB)
dr.line([84,y+98,W-84,y+98],fill=GOLD,width=2)
dr.text((84,y+110),'También hoy, métanle pronóstico ANTES del pitazo:',font=F(18,bold=False),fill=CREAM)
dr.text((84,y+140),'🏴 Escocia-Brasil · 🇲🇦 Marruecos-Haití · 🇨🇭 Suiza-Canadá',font=F(18),fill=WHITE)
dr.text((84,y+170),'🇧🇦 Bosnia-Catar · 🇿🇦 Sudáfrica-Corea',font=F(18),fill=WHITE)
dr.text((84,y+200),'🔒 La app cierra cada partido al arranque. ¡No se duerman!',font=FB(17),fill=GOLDB)
y+=250

# ===== Pie =====
dr.rounded_rectangle([60,y,W-60,y+54],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((W//2,y+14),'🦅 MF GROUP  ·  🐷 UNIÓN PORCÍCOLA  ·  🟣 INPLUX',font=FB(22),fill=GOLDB,anchor='ma')
y+=64
dr.rounded_rectangle([W//2-220,y,W//2+220,y+42],radius=14,fill=NAVY2,outline=GOLD,width=2)
dr.text((W//2,y+9),'pollamundialnatillera.vercel.app',font=FB(20),fill=WHITE,anchor='ma')

img.save('/tmp/boletin-charter.png'); print('OK',img.size)

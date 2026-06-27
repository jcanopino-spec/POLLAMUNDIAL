from PIL import Image, ImageDraw, ImageFont
import os, textwrap

INK=(11,20,40); NAVY=(16,30,58); NAVY2=(22,40,74); GREEN=(40,140,60); RED=(150,40,40)
GOLD=(214,175,55); GOLDB=(247,216,104); CREAM=(245,238,224); WHITE=(255,255,255)
BLUE=(40,90,180); BLUEH=(52,120,220); MEXG=(0,104,71); MEXR=(206,17,38)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

W,H=1200,2200
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H
    if t<0.5: c=(int(70+t*60),int(60+t*40),int(90+t*30))
    else: c=(int(30+(t-0.5)*20),int(70+(t-0.5)*60),int(35))
    dr.line([(0,y),(W,y)],fill=c)
for i in range(140):
    x=(i*113+30)%W; yy=(i*71+20)%H; s=6+(i%3)*4
    cols=[(225,56,47),(27,145,80),(52,71,214),GOLDB,WHITE]
    dr.rectangle([x,yy,x+s,yy+int(s*1.4)],fill=cols[i%5])

def head(path,x,size,y):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,y),m)
head('public/cerdino-head.png', 40, 150, 38)
head('public/mfito-head.png', 175, 150, 38)
dr.text((W-40,38),'POLLA DE ALAMEDA',font=FB(30),fill=WHITE,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,84),'BOLETÍN',font=FB(72),fill=WHITE,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,158),'EDICIÓN EN VIVO 🛰️',font=FB(40),fill=GOLDB,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,212),'CORTE 23-JUN · RESULTADOS HASTA AYER',font=F(20),fill=CREAM,anchor='ra',stroke_width=1,stroke_fill=INK)

dr.rounded_rectangle([30,290,W-30,H-30],radius=24,outline=GREEN,width=6)
dr.rounded_rectangle([34,294,W-34,H-34],radius=22,outline=RED,width=3)

# ===== PANEL 1: ASÍ ESTUVO AYER =====
y=320
dr.rounded_rectangle([60,y,W-60,y+560],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.rounded_rectangle([60,y,W-60,y+46],radius=16,fill=GREEN)
dr.text((84,y+9),'📅 ASÍ RUGIÓ LA CANCHA AYER (22-JUN):',font=FB(25),fill=WHITE)
games=[
 ('🇦🇷','ARGENTINA 2-0 AUSTRIA','Doblete de Messi (38ʼ y al 90+5ʼ, pa cerrar con tacuche). La Pulga no perdona.','🎯 5 clavaron el 2-0: Carlitos, El constructor, Ivancho, El periodista y Maíz.'),
 ('🇫🇷','FRANCIA 3-0 IRAK','Mbappé doblete y Dembélé puso el tercero. Goleada cantada.','🎯 ¡FIESTA DE 13 EXACTOS al 3-0! Yuyeimi, Martin Fierro, Don Edson, Gerundio y compañía.'),
 ('🇳🇴','NORUEGA 3-2 SENEGAL','¡Partidazo! Haaland doblete, Sarr respondió 2 veces, 5 goles de infarto.','💀 NADIE clavó el exacto (5 goles es brujería). 18 salvaron el resultado.'),
 ('🇯🇴','JORDANIA 1-2 ARGELIA','Argelia la dio vuelta: Benbouali y Gouiri. Jordania madrugó pero no aguantó.','🎯 10 clavaron el 1-2: El constructor, Yuyeimi, Doña Flavia, Gerundio y parche.'),
]
ry=y+58
for fg,tit,desc,hit in games:
    dr.rounded_rectangle([78,ry,W-78,ry+116],radius=12,fill=NAVY2,outline=GOLD,width=1)
    dr.text((96,ry+12),fg,font=FB(30),fill=WHITE)
    dr.text((150,ry+12),tit,font=FB(24),fill=GOLDB)
    for j,w in enumerate(textwrap.wrap(desc,width=78)): dr.text((96,ry+50+j*22),w,font=F(16,bold=False),fill=CREAM)
    dr.text((96,ry+92),hit,font=F(16),fill=(180,235,190))
    ry+=124
y+=580

# ===== PANEL 2: LOS QUE MÁS CLAVARON AYER =====
dr.rounded_rectangle([60,y,W-60,y+170],radius=16,fill=BLUE,outline=GOLD,width=2)
dr.text((84,y+12),'🔥 LOS FRANCOTIRADORES DE AYER',font=FB(28),fill=WHITE)
dr.text((84,y+50),'¡PÓKER DE PUNTERÍA con +16 pts cada uno!',font=FB(20),fill=GOLDB)
names='🎯 Doña Cristina · Yuyeimi · Doña Flavia · Martin Fierro · Gerundio'
dr.text((84,y+86),names,font=FB(22),fill=WHITE)
dr.text((84,y+122),'Detrás: Carlitos, Doña Guess y Maíz con +14. ¡Día de cosecha! 🌽',font=F(18,bold=False),fill=CREAM)
y+=190

# ===== PANEL 3: TABLA DEL CERDO =====
dr.rounded_rectangle([60,y,W-60,y+360],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((84,y+12),'🏆 TABLA DEL CERDO (TOP 6)',font=FB(26),fill=WHITE)
rows=[('Gerundio',102),('Yuyeimi',97),('Martin Fierro',95),('El mayordomo',93),('Maíz',93),('Don Edson',92)]
medal=[GOLDB,(220,220,220),(205,127,50)]
ry=y+56
for i,(n,p) in enumerate(rows):
    bar=medal[i] if i<3 else BLUEH; dark=i<3
    extra=' 🛰️' if n=='Don Edson' else (' 👑' if i==0 else '')
    dr.rounded_rectangle([80,ry,W-80,ry+42],radius=10,fill=bar,outline=WHITE,width=2)
    dr.ellipse([90,ry+6,122,ry+38],fill=WHITE,outline=INK,width=2); dr.text((106,ry+11),str(i+1),font=FB(20),fill=INK,anchor='ma')
    dr.text((140,ry+8),n+extra,font=FB(22),fill=(INK if dark else WHITE))
    dr.text((W-110,ry+4),str(p),font=FB(26),fill=(INK if dark else WHITE),anchor='ma')
    dr.text((W-110,ry+34),'pts',font=F(11),fill=(INK if dark else CREAM),anchor='ma')
    ry+=48
dr.text((W//2,ry+6),'🐷 De colero: SHAKIRA con 61. Las caderas mienten, la tabla no 💃',font=F(17),fill=(255,205,195),anchor='ma')
y+=380

# ===== PANEL 4: HOY EN DIRECTO DESDE MÉXICO =====
dr.rounded_rectangle([60,y,W-60,y+260],radius=16,fill=(8,48,32),outline=GOLDB,width=3)
dr.rectangle([60,y,W-60,y+8],fill=MEXG); dr.rectangle([60,y+8,W-60,y+12],fill=WHITE)
dr.text((84,y+22),'🇲🇽 ¡EN DIRECTO DESDE MÉXICO! 🛰️',font=FB(30),fill=WHITE)
dr.text((84,y+62),'El equipo mundialista de la Polla ya está en el estadio:',font=F(19,bold=False),fill=CREAM)
dr.text((84,y+92),'📡 Don Edson · JuanMa · Jaime — reportando en vivo',font=FB(22),fill=GOLDB)
dr.line([84,y+128,W-84,y+128],fill=GOLD,width=2)
dr.text((84,y+140),'⚽ HOY JUEGA LA TRICOLOR (9:00 PM):',font=FB(24),fill=WHITE)
dr.text((84,y+178),'🇨🇴 COLOMBIA vs CONGO DR 🇨🇩',font=FB(28),fill=GOLDB)
dr.text((84,y+216),'Antes: 🇵🇹 Portugal-Uzbekistán · 🏴 Inglaterra-Ghana · 🇵🇦 Panamá-Croacia',font=F(16,bold=False),fill=CREAM)
y+=280

# ===== Pie =====
dr.rounded_rectangle([60,y,W-60,y+54],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((W//2,y+14),'🦅 MF GROUP  ·  🐷 UNIÓN PORCÍCOLA  ·  🟣 INPLUX',font=FB(22),fill=GOLDB,anchor='ma')
y+=64
dr.rounded_rectangle([W//2-220,y,W//2+220,y+42],radius=14,fill=NAVY2,outline=GOLD,width=2)
dr.text((W//2,y+9),'pollamundialnatillera.vercel.app',font=FB(20),fill=WHITE,anchor='ma')

img.save('/tmp/boletin-mexico.png'); print('OK',img.size)

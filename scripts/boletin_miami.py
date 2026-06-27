from PIL import Image, ImageDraw, ImageFont
import os, textwrap

INK=(11,20,40); NAVY=(16,30,58); NAVY2=(22,40,74); GREEN=(40,140,60); RED=(150,40,40)
GOLD=(214,175,55); GOLDB=(247,216,104); CREAM=(245,238,224); WHITE=(255,255,255)
BLUE=(40,90,180); BLUEH=(52,120,220); PINK=(225,90,150); PINKD=(120,30,70); PALM=(20,120,90)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

W,H=1200,2560
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
# fondo Miami: atardecer rosado arriba, mar/cancha abajo
for y in range(H):
    t=y/H
    if t<0.45: c=(int(230-t*120),int(120+t*60),int(150+t*60))
    else: c=(int(20+(t-0.45)*20),int(80+(t-0.45)*60),int(70+(t-0.45)*20))
    dr.line([(0,y),(W,y)],fill=c)
# palmeras simples a los lados
for px in (70,1120):
    dr.line([(px,230),(px,330)],fill=(60,40,20),width=10)
    for a in range(-3,4):
        dr.line([(px,232),(px+a*22,210+abs(a)*8)],fill=PALM,width=7)
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
dr.text((W-40,158),'EDICIÓN MIAMI 🌴🦩',font=FB(38),fill=PINKD,anchor='ra',stroke_width=2,stroke_fill=WHITE)
dr.text((W-40,210),'CORTE 25-JUN · CONCENTRADOS CON LA TRICOLOR 🇨🇴',font=F(19),fill=INK,anchor='ra',stroke_width=1,stroke_fill=WHITE)

dr.rounded_rectangle([30,288,W-30,H-30],radius=24,outline=GREEN,width=6)
dr.rounded_rectangle([34,292,W-34,H-34],radius=22,outline=RED,width=3)

# ===== REPORTE DESDE MIAMI =====
y=316
dr.rounded_rectangle([60,y,W-60,y+300],radius=16,fill=NAVY,outline=GOLDB,width=2)
dr.rounded_rectangle([60,y,W-60,y+46],radius=16,fill=RED)
dr.text((84,y+9),'📡 REPORTE DESDE MIAMI:',font=FB(26),fill=WHITE)
cron=[
 ('🏨','Los mundialistas ya estamos en MIAMI, CONCENTRADOS con la Selección Colombia. Sí señor: misma sede que la Tricolor 🇨🇴. (Nos colamos, pero estamos).'),
 ('🦅','MFito, alias EL ORÁCULO DE LOS ANDES, sigue desplumándose con cada resultado. Ya casi predice en pelota. ¡Una pluma por cada fallo!'),
 ('📨','¡Los jugadores de la Selección le mandaron un mensaje a MFito! "Maestro, deje de despelucarse que nos pone nerviosos para el partido". 😂'),
]
yy=y+58
for em,ln in cron:
    dr.text((84,yy),em,font=FB(24),fill=GOLDB)
    ws=textwrap.wrap(ln,width=70)
    for j,w in enumerate(ws): dr.text((128,yy+j*23),w,font=F(17,bold=(j==0)),fill=CREAM)
    yy+=23*len(ws)+12
y+=320

# ===== GOLPE DE ESTADO: DOÑA FLAVIA =====
dr.rounded_rectangle([60,y,W-60,y+330],radius=16,fill=PINKD,outline=GOLDB,width=3)
dr.rounded_rectangle([60,y,W-60,y+48],radius=16,fill=PINK)
dr.text((84,y+10),'💃 ¡GOLPE DE ESTADO AL ORÁCULO!',font=FB(26),fill=WHITE)
flav=[
 ('🔥','Doña Flavia AMANECIÓ EN CAMPAÑA: quiere destronar a MFito y quedarse de ORÁCULA OFICIAL. Madrugó con análisis y todo.'),
 ('🔋','Dice que ella SÍ sabe de buenas vibras, que tiene mejor pulso y trae sus propios "instrumentos de medición". Eso sí: recargables 😏.'),
 ('🪶','MFito le responde: "Señora, yo predigo con plumas, usted con pilas. Cada quien con su técnica". Cerdiño pidió que traiga energía... pero de la duradera.'),
 ('📉','Pequeño detalle: la aspirante a oráculo va de PUESTO 22 en la tabla. Primero practique en casa, doña, que el cargo exige aguante 😂.'),
]
yy=y+58
for em,ln in flav:
    dr.text((84,yy),em,font=FB(23),fill=GOLDB)
    ws=textwrap.wrap(ln,width=72)
    for j,w in enumerate(ws): dr.text((124,yy+j*22),w,font=F(16,bold=(j==0)),fill=CREAM)
    yy+=22*len(ws)+9
y+=350

# ===== ASÍ ESTUVO AYER =====
dr.rounded_rectangle([60,y,W-60,y+460],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.rounded_rectangle([60,y,W-60,y+46],radius=16,fill=GREEN)
dr.text((84,y+9),'📅 SÚPER JORNADA DE AYER (24-JUN · 6 PARTIDOS):',font=FB(22),fill=WHITE)
games=[
 ('🇨🇭','Suiza 2-1 Canadá','🎯 6 EXACTOS, ¡y Doña Flavia entre ellos! (por eso se le subió el ego).'),
 ('🇧🇦','Bosnia 3-1 Catar','🎯 El constructor, único francotirador del 3-1.'),
 ('🇲🇦','Marruecos 4-2 Haití','💀 6 goles de locura. NADIE clavó semejante fiesta.'),
 ('🇧🇷','Escocia 0-3 Brasil','🎯 Doblete de Vinicius. 4 clavaron: Ivancho, Matias y Chente, JuanMa y Carlitos.'),
 ('🇲🇽','Chequia 0-3 México','¡El anfitrión nos goleó al frente! 💀 Nadie el exacto.'),
 ('🇿🇦','Sudáfrica 1-0 Corea','Maseko al 63ʼ. Casi nadie le creyó a Sudáfrica.'),
]
ry=y+56
for fg,tit,hit in games:
    dr.rounded_rectangle([78,ry,W-78,ry+58],radius=10,fill=NAVY2,outline=GOLD,width=1)
    dr.text((94,ry+10),fg,font=FB(26),fill=WHITE)
    dr.text((146,ry+8),tit,font=FB(21),fill=GOLDB)
    dr.text((146,ry+34),hit,font=F(15,bold=False),fill=(190,235,200))
    ry+=66
y+=480

# ===== TABLA =====
dr.rounded_rectangle([60,y,W-60,y+330],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((84,y+12),'🏆 TABLA DEL CERDO (TOP 5)',font=FB(26),fill=WHITE)
rows=[('Gerundio',130),('El mayordomo',119),('Yuyeimi',118),('Maíz',116),('Oscarito',114)]
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
dr.text((84,ry+6),'💃 La ORÁCULA Doña Flavia: puesto 22 con 96. ¡A recargar pilas! 🔋',font=F(16),fill=(255,190,215))
dr.text((84,ry+32),'🐷 Colero: DON RSU con 81. Cerdiño ya le apartó el chiquero.',font=F(16),fill=(255,205,195))
y+=350

# ===== HOY =====
dr.rounded_rectangle([60,y,W-60,y+180],radius=16,fill=(8,40,60),outline=GOLDB,width=3)
dr.text((84,y+14),'⚽ HOY (25-JUN) · 6 PARTIDOS, VARIOS SIMULTÁNEOS:',font=FB(22),fill=WHITE)
dr.text((84,y+52),'🇪🇨 Ecuador-Alemania 🇩🇪  ·  🇨🇼 Curazao-C.Marfil',font=FB(20),fill=GOLDB)
dr.text((84,y+82),'🇯🇵 Japón-Suecia  ·  🇹🇳 Túnez-P.Bajos 🇳🇱',font=FB(20),fill=GOLDB)
dr.text((84,y+112),'🇹🇷 Turquía-EE.UU.  ·  🇵🇾 Paraguay-Australia',font=FB(20),fill=GOLDB)
dr.text((84,y+146),'🔒 ¡La app cierra cada partido al pitazo y ahora actualiza EN VIVO! Métanle ya.',font=F(16),fill=CREAM)
y+=200

# ===== Pie =====
dr.rounded_rectangle([60,y,W-60,y+54],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((W//2,y+14),'🦅 MF GROUP  ·  🐷 UNIÓN PORCÍCOLA  ·  🟣 INPLUX',font=FB(22),fill=GOLDB,anchor='ma')
y+=64
dr.rounded_rectangle([W//2-220,y,W//2+220,y+42],radius=14,fill=NAVY2,outline=GOLD,width=2)
dr.text((W//2,y+9),'pollamundialnatillera.vercel.app',font=FB(20),fill=WHITE,anchor='ma')

img.save('/tmp/boletin-miami.png'); print('OK',img.size)

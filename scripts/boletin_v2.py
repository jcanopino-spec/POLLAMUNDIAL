from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, json, textwrap
d = json.load(open('/tmp/resumen.json'))
# Paleta tipo el modelo: azul marino paneles, verde y rojo bordes, dorado
INK=(11,20,40); NAVY=(16,30,58); NAVY2=(22,40,74); GREEN=(40,140,60); RED=(150,40,40); GOLD=(214,175,55); GOLDB=(247,216,104); CREAM=(245,238,224); WHITE=(255,255,255); BLUE=(40,90,180); BLUEH=(52,120,220)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
AV=['🐔','🐓','🦅','⚽','🥅','🧤','🦁','🐆','🦊','😎','🤠','👽','💃','🧢','🍔','🎩','🤓','👑','💈','🍳','📐','🐶','📰','🧱','🛎️','🌽','🪗','🎤','🛍️','🐴']
def av(nm):
    h=0
    for c in nm: h=(h*31+ord(c))%997
    return AV[h%len(AV)]

W,H=1200,1740
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
# fondo estadio: degradado atardecer arriba + verde abajo
for y in range(H):
    t=y/H
    if t<0.5: c=(int(70+t*60),int(60+t*40),int(90+t*30))
    else: c=(int(30+ (t-0.5)*20),int(70+(t-0.5)*60),int(35))
    dr.line([(0,y),(W,y)],fill=c)
# confeti
for i in range(120):
    x=(i*113+30)%W; yy=(i*71+20)%H; s=6+(i%3)*4
    cols=[(225,56,47),(27,145,80),(52,71,214),GOLDB,WHITE]
    dr.rectangle([x,yy,x+s,yy+int(s*1.4)],fill=cols[i%5])

# Cabecera: dos mascotas + título
def head(path,x,size,y):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,y),m)
head('public/cerdino-head.png', 40, 150, 40)
head('public/mfito-head.png', 175, 150, 40)
dr.text((W-40,40),'POLLA DE ALAMEDA',font=FB(30),fill=WHITE,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,86),'BOLETÍN',font=FB(72),fill=WHITE,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,160),'FASE DE GRUPOS',font=FB(48),fill=GOLDB,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,222),f"CORTE AL {d['fecha']} · {d['dia']} PARTIDOS JUGADOS",font=F(20),fill=CREAM,anchor='ra',stroke_width=1,stroke_fill=INK)

# Marco general
dr.rounded_rectangle([30,300,W-30,H-30],radius=24,outline=GREEN,width=6)
dr.rounded_rectangle([34,304,W-34,H-34],radius=22,outline=RED,width=3)

# Panel: MFITO & CERDIÑO REPORTAN
y=330
dr.rounded_rectangle([60,y,W-60,y+330],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.rounded_rectangle([60,y,W-60,y+44],radius=16,fill=GREEN)
dr.text((84,y+10),'🦅 MFITO & 🐷 CERDIÑO REPORTAN:',font=FB(24),fill=WHITE)
cron=[
 ('📢','¡LA APP SE ACTUALIZO! Ahora trae En Vivo con guillotina, tablas de grupos, goleadores y vibracion en los goles. Abranla que esta full.'),
 ('🔍','Hicimos AUDITORIA de la tabla: a varios les faltaban puntos (¡Estupiñan tenia razon!) y ya quedaron organizados. Revisen su posicion.'),
 ('🏍️','En la cancha: Gerundio lidera con 77 y TRES le pisan los talones a 73. Falta el partido de las 11 PM... ahi puede cambiar todo.'),
]
yy=y+58
for em,ln in cron:
    dr.text((84,yy),em,font=FB(24),fill=GOLDB)
    ws=textwrap.wrap(ln,width=62)
    for j,w in enumerate(ws): dr.text((128,yy+j*26),w,font=F(18,bold=(j==0)),fill=CREAM)
    yy+=26*len(ws)+12
y+=350

# Panel: LOS PUNTEROS
dr.rounded_rectangle([60,y,W-60,y+470],radius=16,fill=BLUE,outline=GOLD,width=2)
dr.text((84,y+12),'LOS PUNTEROS',font=FB(30),fill=WHITE)
dr.text((350,y+20),'(LÍDERES DEL TORNEO)',font=F(20),fill=CREAM)
medalcol=[GOLDB,(220,220,220),(205,127,50)]
ry=y+60
for i,r in enumerate(d['rows'][:6]):
    barcol = medalcol[i] if i<3 else BLUEH
    dark = i<3
    dr.rounded_rectangle([80,ry,W-80,ry+58],radius=12,fill=barcol,outline=WHITE,width=2)
    dr.ellipse([92,ry+10,134,ry+52],fill=WHITE,outline=INK,width=2); dr.text((113,ry+18),str(i+1),font=FB(24),fill=INK,anchor='ma')
    dr.text((150,ry+10),av(r['nm']),font=F(26),fill=INK)
    dr.text((196,ry+8),r['nm']+('  🏍️' if r['nm']=='Gerundio' else ''),font=FB(25),fill=(INK if dark else WHITE))
    dr.text((196,ry+36),'Casa '+str(r['casa']),font=F(15),fill=(INK if dark else CREAM))
    # caja de puntos a la derecha (separada)
    fg = INK if dark else WHITE
    dr.text((W-118,ry+6),str(r['total']),font=FB(34),fill=fg,anchor='ma')
    dr.text((W-118,ry+44),'PTS',font=F(13),fill=fg,anchor='ma')
    ry+=66
y+=490

# Panel: ZONA DEL CERDO
last3=d['rows'][-3:]
dr.rounded_rectangle([60,y,W-60,y+250],radius=16,fill=(60,24,24),outline=RED,width=3)
dr.text((84,y+12),'LA ZONA DEL CERDO',font=FB(28),fill=WHITE)
dr.text((420,y+20),'(ÚLTIMOS PUESTOS)',font=F(18),fill=(255,200,190))
ry=y+58
for idx,r in enumerate(last3):
    isLast = idx==len(last3)-1
    dr.rounded_rectangle([80,ry,W-80,ry+56],radius=12,fill=(90,30,28) if isLast else (50,30,30),outline=RED,width=2)
    dr.text((100,ry+12),av(r['nm']),font=F(24),fill=WHITE)
    dr.text((146,ry+6),r['nm']+(' 🐷 ¡EL CERDO!' if isLast else ''),font=FB(23),fill=(255,210,200) if isLast else WHITE)
    dr.text((146,ry+34),'Casa '+str(r['casa']),font=F(15),fill=(255,200,190))
    dr.text((W-118,ry+8),str(r['total']),font=FB(28),fill=WHITE,anchor='ma')
    dr.text((W-118,ry+40),'PTS',font=F(12),fill=(255,200,190),anchor='ma')
    ry+=62
y+=274

# Pie patrocinadores
dr.rounded_rectangle([60,y,W-60,y+58],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((W//2,y+16),'🦅 MF GROUP  ·  🐷 UNIÓN PORCÍCOLA  ·  🟣 INPLUX',font=FB(24),fill=GOLDB,anchor='ma')
y+=70
dr.rounded_rectangle([W//2-210,y,W//2+210,y+44],radius=14,fill=NAVY2,outline=GOLD,width=2)
dr.text((W//2,y+10),'pollamundialnatillera.vercel.app',font=FB(20),fill=WHITE,anchor='ma')
y+=58
# comentarios mascotas
dr.rounded_rectangle([60,y,W-60,y+110],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((84,y+12),'💬 EL CHISME:',font=FB(22),fill=GOLDB)
dr.text((84,y+44),'🐷 Cerdiño: "El que pierda hoy a las 11, duerme pensando en el marrano."',font=F(18),fill=CREAM)
dr.text((84,y+74),'🦅 MFito: "Pronostico que alguien se cae de la tabla hoy (eso sí lo acierto)."',font=F(18),fill=CREAM)
img.save('/tmp/boletin-v2.png'); print('OK',img.size)

from PIL import Image, ImageDraw, ImageFont
import os, textwrap

INK=(11,20,40); NAVY=(16,30,58); NAVY2=(22,40,74); GREEN=(40,140,60); RED=(150,40,40)
GOLD=(214,175,55); GOLDB=(247,216,104); CREAM=(245,238,224); WHITE=(255,255,255)
BLUE=(40,90,180); BLUEH=(52,120,220); PURP=(86,54,140); SILV=(210,210,215)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

W,H=1200,1720
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H
    c=(int(20+t*30),int(28+t*50),int(60+t*70)) if t<0.5 else (int(28+(t-0.5)*16),int(70+(t-0.5)*50),int(45))
    dr.line([(0,y),(W,y)],fill=c)
for i in range(110):
    x=(i*113+30)%W; yy=(i*71+20)%H; s=6+(i%3)*4
    cols=[(225,56,47),(27,145,80),(52,71,214),GOLDB,WHITE]
    dr.rectangle([x,yy,x+s,yy+int(s*1.4)],fill=cols[i%5])

def head(path,x,size,y):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,y),m)
head('public/cerdino-head.png', 40, 150, 38)
head('public/mfito-head.png', 175, 150, 38)
dr.text((W-40,40),'POLLA DE ALAMEDA',font=FB(28),fill=WHITE,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,82),'¡CAMBIO DE REGLAS!',font=FB(54),fill=GOLDB,anchor='ra',stroke_width=2,stroke_fill=INK)
dr.text((W-40,148),'ARRANCA LA FASE DE ELIMINACIÓN ⚔️',font=FB(30),fill=WHITE,anchor='ra',stroke_width=1,stroke_fill=INK)
dr.text((W-40,196),'NUEVO PUNTAJE DESDE DIECISEISAVOS',font=F(20),fill=CREAM,anchor='ra',stroke_width=1,stroke_fill=INK)

dr.rounded_rectangle([30,260,W-30,H-30],radius=24,outline=GREEN,width=6)
dr.rounded_rectangle([34,264,W-34,H-34],radius=22,outline=RED,width=3)

# ===== AVISO: GRUPOS CERRADO =====
y=290
dr.rounded_rectangle([60,y,W-60,y+120],radius=16,fill=(40,60,40),outline=GREEN,width=2)
dr.text((84,y+14),'✅ LA FASE DE GRUPOS YA CERRÓ',font=FB(26),fill=GOLDB)
for j,w in enumerate(textwrap.wrap('Esos puntos quedan CONGELADOS tal como terminaron (líder Gerundio 163, colero Don RSU 105). La nueva regla NO toca nada de grupos: arranca limpia desde dieciseisavos.',width=74)):
    dr.text((84,y+52+j*24),w,font=F(16,bold=False),fill=CREAM)
y+=140

# ===== LA REGLA NUEVA: 3 FORMAS =====
dr.rounded_rectangle([60,y,W-60,y+430],radius=16,fill=PURP,outline=GOLDB,width=3)
dr.rounded_rectangle([60,y,W-60,y+50],radius=16,fill=GOLDB)
dr.text((W//2,y+10),'🥈 NUEVA REGLA: 3 FORMAS DE SUMAR',font=FB(26),fill=INK,anchor='ma')
dr.text((W//2,y+64),'Cuando ACIERTAS EL GANADOR del partido:',font=FB(20),fill=WHITE,anchor='ma')
# tarjetas ejemplo (dieciseisavos x2)
cards=[
 ('🎯','MARCADOR EXACTO','Clavas el resultado completo','10',GREEN),
 ('🥈','GANADOR + GOLES DEL GANADOR','Aciertas cuántos goles metió el que ganó (sin ser exacto)','8',BLUE),
 ('✅','SOLO EL GANADOR','Acertaste quién gana, pero no los goles','6',(120,90,40)),
]
ry=y+98
for em,tit,desc,pts,col in cards:
    dr.rounded_rectangle([84,ry,W-84,ry+96],radius=12,fill=NAVY2,outline=col,width=3)
    dr.text((104,ry+14),em,font=FB(40),fill=WHITE)
    dr.text((170,ry+12),tit,font=FB(21),fill=GOLDB)
    for j,w in enumerate(textwrap.wrap(desc,width=58)): dr.text((170,ry+46+j*22),w,font=F(15,bold=False),fill=CREAM)
    dr.ellipse([W-180,ry+12,W-100,ry+92],fill=col,outline=WHITE,width=3)
    dr.text((W-140,ry+30),pts,font=FB(38),fill=WHITE,anchor='ma')
    ry+=104
dr.text((W//2,ry+2),'(ejemplo en 16avos ×2 · el +2 del 🥈 es plano)',font=F(15,bold=False),fill=(220,210,240),anchor='ma')
y+=450

# ===== EJEMPLO CLARITO =====
dr.rounded_rectangle([60,y,W-60,y+150],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((84,y+12),'📝 EJEMPLO (para que no haya reclamos):',font=FB(22),fill=GOLDB)
dr.text((84,y+48),'Si Brasil le gana 3-1 a Japón en 16avos:',font=FB(18),fill=WHITE)
ex=[('Pusiste 3-1','🎯 exacto','10 pts',GREEN),('Pusiste 3-0 o 3-2','🥈 goles del ganador','8 pts',BLUE),('Pusiste 2-0','✅ solo ganador','6 pts',(150,120,60))]
ry=y+78
for a,b,c,col in ex:
    dr.text((100,ry),'•',font=FB(18),fill=col); dr.text((124,ry),a+' → '+b,font=F(16,bold=False),fill=CREAM)
    dr.text((W-100,ry),c,font=FB(18),fill=col,anchor='ra'); ry+=24
y+=170

# ===== TABLA MULTIPLICADORES POR FASE =====
dr.rounded_rectangle([60,y,W-60,y+360],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((84,y+12),'📈 LO QUE VALE CADA FASE',font=FB(24),fill=WHITE)
cols=['FASE','EXACTO 🎯','+GOLES 🥈','GANADOR ✅']
cx=[90,560,760,960]
dr.rounded_rectangle([80,y+48,W-80,y+82],radius=8,fill=GOLDB)
for i,c in enumerate(cols): dr.text((cx[i],y+54),c,font=FB(17),fill=INK)
rowsT=[('16avos ×2','10','8','6'),('Octavos ×3','15','11','9'),('Cuartos ×4','20','14','12'),('Semis ×5','25','17','15'),('3er puesto ×5','25','17','15'),('FINAL ×6','30','20','18')]
ry=y+88
for i,(f,e,g,w_) in enumerate(rowsT):
    bg=(60,40,80) if f.startswith('FINAL') else (NAVY2 if i%2 else (28,46,84))
    dr.rounded_rectangle([80,ry,W-80,ry+40],radius=6,fill=bg)
    dr.text((cx[0],ry+9),f,font=FB(18),fill=GOLDB if f.startswith('FINAL') else WHITE)
    dr.text((cx[1]+18,ry+9),e,font=FB(19),fill=(120,235,150))
    dr.text((cx[2]+12,ry+9),g,font=FB(19),fill=(140,180,245))
    dr.text((cx[3]+12,ry+9),w_,font=FB(19),fill=CREAM)
    ry+=44
y+=380

# ===== CUÁNDO =====
dr.rounded_rectangle([60,y,W-60,y+130],radius=16,fill=(8,40,60),outline=GOLDB,width=3)
dr.text((84,y+12),'⚔️ ¡YA ARRANCÓ! (16avos · 28-jun)',font=FB(24),fill=WHITE)
dr.text((84,y+50),'🇨🇴 COLOMBIA vs GHANA → jueves 3-jul, 8:30 PM',font=FB(20),fill=GOLDB)
dr.text((84,y+84),'🔒 Pronostica antes del pitazo. ¡Ahora cada acierto vale ORO!',font=F(17,bold=False),fill=CREAM)
y+=150

# ===== Pie =====
dr.rounded_rectangle([60,y,W-60,y+50],radius=16,fill=NAVY,outline=GOLD,width=2)
dr.text((W//2,y+6),'🦅 MF GROUP · 🐷 UNIÓN PORCÍCOLA · 🟣 INPLUX',font=FB(18),fill=GOLDB,anchor='ma')
dr.text((W//2,y+28),'pollamundialnatillera.vercel.app',font=FB(17),fill=WHITE,anchor='ma')

img.save('/tmp/anuncio-puntos.png'); print('OK',img.size)

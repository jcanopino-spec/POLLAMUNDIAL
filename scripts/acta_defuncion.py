from PIL import Image, ImageDraw, ImageFont
import os, textwrap

INK=(13,12,15); STONE=(60,62,70); STONE2=(78,80,90); CREAM=(238,232,220); WHITE=(255,255,255)
GOLD=(214,175,55); GOLDB=(247,216,104); RED=(170,40,40); GREEN=(40,140,60)
GER_BLACK=(20,20,20); GER_RED=(221,0,0); GER_GOLD=(255,206,0)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

W,H=1200,1330
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(18+t*22),int(18+t*24),int(26+t*30)))
dr.ellipse([980,60,1120,200],fill=(230,228,210)); dr.ellipse([1010,70,1110,170],fill=(20,20,28))
for lx in (120,300,900,1060):
    dr.rounded_rectangle([lx,250,lx+90,360],radius=40,fill=(40,42,50))
    dr.line([(lx+45,290),(lx+45,330)],fill=(60,62,70),width=4); dr.line([(lx+28,305),(lx+62,305)],fill=(60,62,70),width=4)

dr.rectangle([0,0,W,16],fill=GER_BLACK); dr.rectangle([0,16,W,32],fill=GER_RED); dr.rectangle([0,32,W,48],fill=GER_GOLD)
dr.text((W//2,70),'💀  ACTA DE DEFUNCIÓN  💀',font=FB(48),fill=WHITE,anchor='ma',stroke_width=2,stroke_fill=INK)
dr.text((W//2,135),'POLLA DE ALAMEDA · SECCIÓN FORENSE',font=F(20),fill=GOLDB,anchor='ma')
dr.rounded_rectangle([180,180,W-180,250],radius=14,fill=GER_RED,outline=GOLDB,width=2)
dr.text((W//2,196),'🇩🇪 ALEMANIA — ELIMINADA EN 16vos',font=FB(26),fill=WHITE,anchor='ma')
dr.text((W//2,392),'Causa de la muerte: 🇵🇾 PARAGUAY (hoy, por penales).',font=F(19),fill=CREAM,anchor='ma')
dr.text((W//2,420),'Daños colaterales: las apuestas de DOS compadres 👇',font=FB(20),fill=GOLDB,anchor='ma')

# ===== PANEL: LA ASESORÍA FATAL =====
y=462
dr.rounded_rectangle([70,y,W-70,y+330],radius=26,fill=STONE,outline=GOLDB,width=4)
dr.rounded_rectangle([70,y,W-70,y+48],radius=26,fill=(120,30,30))
dr.text((W//2,y+10),'🐔 LA ASESORÍA FATAL',font=FB(30),fill=WHITE,anchor='ma')
# periodista → mayordomo
dr.rounded_rectangle([105,y+70,560,y+150],radius=14,fill=STONE2,outline=GOLDB,width=2)
dr.text((332,y+82),'🗞️ EL PERIODISTA',font=FB(24),fill=WHITE,anchor='ma')
dr.text((332,y+116),'"el analista" 🤓',font=F(17,bold=False),fill=GOLDB,anchor='ma')
dr.text((600,y+96),'➜ le dicta ➜',font=FB(20),fill=GOLDB,anchor='ma')
dr.rounded_rectangle([700,y+70,W-105,y+150],radius=14,fill=STONE2,outline=GOLDB,width=2)
dr.text((897,y+82),'🤵 EL MAYORDOMO',font=FB(24),fill=WHITE,anchor='ma')
dr.text((897,y+116),'copia TODO sin chistar',font=F(17,bold=False),fill=GOLDB,anchor='ma')
# remate gallinas
dr.rounded_rectangle([105,y+168,W-105,y+312],radius=14,fill=(46,30,30),outline=RED,width=2)
dr.text((W//2,y+182),'🐔 EL PROBLEMITA:',font=FB(22),fill=GOLDB,anchor='ma')
for j,w in enumerate(textwrap.wrap('Resulta que el periodista sabe MÁS de MATERNIDAD DE GALLINAS que de fútbol. Su gran "dato de experto": Alemania campeona. Y el mayordomo, fiel, lo copió calcadito… ¡a la tumba juntos! ⚰️',width=72)):
    dr.text((W//2,y+216+j*26),w,font=F(18),fill=CREAM,anchor='ma')

# ===== DATOS CALCADOS (los dos) =====
y2=y+352
dr.rounded_rectangle([70,y2,W-70,y2+250],radius=24,fill=STONE,outline=GOLDB,width=3)
dr.text((W//2,y2+14),'📋 PRONÓSTICOS CALCADOS (idénticos, claro):',font=FB(22),fill=GOLDB,anchor='ma')
rows=[('🗞️ Periodista','👑 Alemania  +  ⭐ Alemania','💀 −45',RED),
      ('🤵 Mayordomo','👑 Alemania  +  ⭐ Alemania','💀 −45',RED),
      ('🤵 …su único acierto','⭐ Paraguay (de pura carambola)','✅ vivo',GREEN)]
ry=y2+54
for who,pick,pts,col in rows:
    dr.rounded_rectangle([105,ry,W-105,ry+56],radius=10,fill=STONE2,outline=col,width=2)
    dr.text((125,ry+8),who,font=FB(19),fill=CREAM)
    dr.text((125,ry+32),pick,font=F(16,bold=False),fill=WHITE)
    dr.text((W-125,ry+16),pts,font=FB(22),fill=(255,150,140) if col==RED else (160,235,170),anchor='ra')
    ry+=62

# remate Paraguay (debajo del panel)
dr.text((W//2,y2+262),'😂 Y lo más cruel: Paraguay, su propio finalista, fue quien enterró a Alemania.',font=F(16),fill=GOLDB,anchor='ma')

# Moraleja
y3=y2+292
dr.rounded_rectangle([70,y3,W-70,y3+96],radius=18,fill=(20,40,30),outline=GREEN,width=3)
dr.text((W//2,y3+14),'📲 MORALEJA PA\' EL MAYORDOMO:',font=FB(22),fill=GOLDB,anchor='ma')
for j,w in enumerate(textwrap.wrap('Pídale el dato a alguien que vea FÚTBOL, no a un criador de gallinas 🐔. Y abra el Simulador (🏆 Camino a la final), ¡que regalar 45 puntos duele!',width=76)):
    dr.text((W//2,y3+46+j*23),w,font=F(16),fill=CREAM,anchor='ma')

def head(path,x,size,yy):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,yy),m)
head('public/cerdino-head.png', 80, 86, H-120)
head('public/mfito-head.png', 172, 86, H-120)
dr.text((W//2+40,H-108),'🐷 Cerdiño: "Mayordomo, deje al periodista con sus gallinas."',font=F(17),fill=CREAM,anchor='ma')
dr.text((W//2+40,H-80),'🦅 MFito: "Para datos de fútbol… estoy yo, el oráculo. 🪶"',font=F(17),fill=CREAM,anchor='ma')
dr.text((W//2,H-42),'🦅 MF GROUP · 🐷 UNIÓN PORCÍCOLA · 🟣 INPLUX',font=FB(18),fill=GOLDB,anchor='ma')

img.save('/tmp/acta-defuncion.png'); print('OK',img.size)

# Previa de mañana: partidos + cuotas + chistes + bullying a MFito + recordatorio.
# Datos en /tmp/manana.json. Uso: python3 scripts/generar_previa.py
from PIL import Image, ImageDraw, ImageFont
import json, os, textwrap

d = json.load(open('/tmp/manana.json'))
INK=(20,18,15); BG1=(24,21,16); BG2=(13,11,8); CARD=(38,34,26); CARD2=(46,41,31)
GOLD=(201,162,39); GOLDB=(245,211,99); CREAM=(245,238,222); WHITE=(255,255,255); GREEN=(74,200,130); RED=(228,92,80)
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'
    return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'
    return ImageFont.truetype(p,sz) if os.path.exists(p) else F(sz)

# chiste por partido según el favorito (cuota más baja)
def chiste(p):
    o=p['odds']
    if not o: return 'Sin cuotas todavía: pronostiquen con el corazón (o con miedo).'
    fav = min([('local',o['h'],p['h']),('empate',o['d'],'el empate'),('visita',o['a'],p['a'])], key=lambda x:x[1])
    favn, favc, favteam = fav
    rem = {
        'Suiza':'Catar no le gana ni con MFito de técnico.',
        'Brasil':'Marruecos ya botó gigantes... pero las casas no creen.',
        'Escocia':'Haití quiere el batacazo; Escocia a no dormirse.',
        'Turquía':'Los canguros a brincar, que la cosa está dura.',
    }.get(favteam if favn!='empate' else '', f"{favteam} es el favorito ({favc}). Ojo al batacazo.")
    return f"Las casas dan favorito a {favteam} ({favc}). {rem}"

W=1080
nmatch=len(d['partidos'])
H=470 + nmatch*186 + 470
img=Image.new('RGB',(W,H),BG1); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(BG1[0]*(1-t)+BG2[0]*t),int(BG1[1]*(1-t)+BG2[1]*t),int(BG1[2]*(1-t)+BG2[2]*t)))
dr.rectangle([12,12,W-12,H-12],outline=GOLD,width=4)

# MFito arriba derecha
mf=Image.open('/tmp/mfito.png').convert('RGBA')
mfh=420; mfw=int(mf.width*mfh/mf.height); mf=mf.resize((mfw,mfh))
img.paste(mf,(W-mfw+8,30),mf)

dr.text((50,52),'POLLA DE ALAMEDA',font=FB(30),fill=GOLD)
dr.text((50,94),'LO QUE VIENE',font=FB(64),fill=WHITE)
dr.text((50,164),'MAÑANA',font=FB(64),fill=GOLDB)
dr.text((52,244),'Cuotas en vivo de las casas de apuestas',font=F(21),fill=CREAM)

# Partidos
y=300
dr.text((50,y),'LOS PARTIDOS',font=FB(30),fill=GOLDB); y+=50
for p in d['partidos']:
    dr.rounded_rectangle([46,y,W-46,y+170],radius=18,fill=CARD,outline=GOLD,width=2)
    dr.text((68,y+14),f"{p['h']}  vs  {p['a']}",font=FB(28),fill=WHITE)
    dr.text((W-68,y+16),f"Gpo {p['gpo']} · {p['hora']}",font=F(18),fill=GOLDB,anchor='ra')
    # cuotas
    o=p['odds']
    if o:
        mn=min(o['h'],o['d'],o['a'])
        labels=[(p['h'],o['h']),('Empate',o['d']),(p['a'],o['a'])]
        cw=(W-92-2*12)//3
        for i,(lab,val) in enumerate(labels):
            cx=68+i*(cw+12)
            fav = val==mn
            dr.rounded_rectangle([cx,y+54,cx+cw,y+106],radius=10,fill=(GOLDB if fav else CARD2),outline=GOLD,width=2)
            dr.text((cx+cw//2,y+60),lab[:14],font=F(15),fill=(INK if fav else CREAM),anchor='ma')
            dr.text((cx+cw//2,y+78),f"{val:.2f}",font=FB(24),fill=(INK if fav else WHITE),anchor='ma')
    # chiste
    for j,ln in enumerate(textwrap.wrap(chiste(p),width=72)[:2]):
        dr.text((68,y+116+j*22),ln,font=F(17),fill=CREAM)
    y+=186

# Bullying MFito
y+=4
mbh=130
dr.rounded_rectangle([46,y,W-46,y+mbh],radius=16,fill=(30,27,20),outline=GOLDB,width=2)
mfm=Image.open('/tmp/mfito.png').convert('RGBA'); mmh=108; mmw=int(mfm.width*mmh/mfm.height); mfm=mfm.resize((mmw,mmh))
img.paste(mfm,(64,y+(mbh-mmh)//2),mfm)
dr=ImageDraw.Draw(img)
tx=64+mmw+20
dr.text((tx,y+16),'MFITO YA PRONOSTICÓ MAÑANA:',font=FB(23),fill=RED)
dr.text((tx,y+50),'Garantía de que NO va a pasar.',font=F(19),fill=CREAM)
dr.text((tx,y+76),'Si MFito dice Brasil, apuéstele a Marruecos.',font=F(19),fill=GOLDB)
dr.text((tx,y+100),'El pájaro es el mejor anti-pronóstico del Mundial.',font=F(17),fill=GOLDB)
y+=mbh+14

# Recordatorio morosos
mr=d.get('morosos',[])
rh=150
dr.rounded_rectangle([46,y,W-46,y+rh],radius=16,fill=(64,32,30),outline=RED,width=2)
dr.text((W//2,y+14),'¡FALTAN POR PRONOSTICAR MAÑANA!',font=FB(26),fill=(255,210,200),anchor='ma')
mlist=', '.join(mr) if mr else 'nadie, todos juiciosos'
for j,ln in enumerate(textwrap.wrap(mlist,width=58)[:2]):
    dr.text((W//2,y+50+j*26),ln,font=FB(20),fill=WHITE,anchor='ma')
dr.text((W//2,y+rh-26),'Pueden meterlos y MODIFICARLOS hasta que pite cada partido. Después, al cerdo.',font=F(16),fill=CREAM,anchor='ma')
y+=rh+18

dr.text((W//2,y),'Mascota oficial: MFito · MF GROUP',font=FB(20),fill=GOLDB,anchor='ma')
dr.text((W//2,H-44),'pollamundialnatillera.vercel.app',font=FB(22),fill=GOLD,anchor='ma')

img.save('/tmp/previa-manana.png')
print('OK', img.size)

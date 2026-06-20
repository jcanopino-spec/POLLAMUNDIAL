from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, json, textwrap
d = json.load(open('/tmp/resumen.json'))
INK=(15,13,10); GOLD=(201,162,39); GOLDB=(245,211,99); CREAM=(245,238,222); WHITE=(255,255,255); GREEN=(74,200,130); RED=(228,92,80); CARD=(38,34,26)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
W,H=1080,1780
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(24+t*8),int(20+t*6),int(14+t*4)))
# fondo futbolero detrás de Bonny
try:
    bg=Image.open('/Users/jacp/mundial2026-simulador/public/stadiums/new_york.jpg').convert('RGB').resize((W,360)).filter(ImageFilter.GaussianBlur(6))
    img.paste(bg,(0,30))
    reg=img.crop((0,30,W,390)).convert('RGBA'); ov=Image.new('RGBA',(W,360),(15,13,10,150))
    img.paste(Image.alpha_composite(reg,ov).convert('RGB'),(0,30))
except Exception as e: print('bg',e)
bn=Image.open('/tmp/bonny-orig.png').convert('RGBA'); bh=300; bw=int(bn.width*bh/bn.height); bn=bn.resize((bw,bh))
img.paste(bn,(W-bw-20,46),bn)
# marquito a la foto (que se vea el whisky)
ImageDraw.Draw(img).rectangle([W-bw-20,46,W-20,46+bh],outline=GOLDB,width=3)
dr=ImageDraw.Draw(img)
dr.text((44,52),'POLLA DE ALAMEDA',font=FB(30),fill=GOLDB,stroke_width=2,stroke_fill=INK)
dr.text((44,96),'BOLETÍN',font=FB(72),fill=WHITE,stroke_width=2,stroke_fill=INK)
dr.text((44,168),'DÍA '+str(d['dia']),font=FB(72),fill=GOLDB,stroke_width=2,stroke_fill=INK)
dr.text((46,250),d['fecha'],font=F(22),fill=CREAM,stroke_width=2,stroke_fill=INK)
dr.text((46,284),'Redacta: BONNY (amo dormido o con whisky)',font=FB(20),fill=GOLDB,stroke_width=2,stroke_fill=INK)
dr.rectangle([12,12,W-12,H-12],outline=GOLD,width=4)

y=410
dr.rounded_rectangle([40,y,W-40,y+330],radius=18,fill=CARD,outline=GOLDB,width=2)
dr.text((64,y+16),'GUAU GUAU, PARCHE. AL GRANO:',font=FB(26),fill=GOLDB)
anuncios=[
 ('1.','Para estar ARRIBA hay que NO vivir en la Alameda: los punteros son la casa 2026, los invitados! Los de casa... ja.'),
 ('2.','El pajaro MFito empezo a escribir este boletin... pero no atina ni el teclado. Lo jubilamos.'),
 ('3.','Desde hoy lo redacto YO, Bonny: cuando el amo esta dormido o bajo los efectos del whisky, yo escribo y lo mando solito. Servicio automatico, salud!'),
]
yy=y+58
for nro,txt in anuncios:
    dr.text((64,yy),nro,font=FB(28),fill=RED)
    wr=textwrap.wrap(txt,width=58)
    for j,ln in enumerate(wr):
        dr.text((110,yy+j*30),ln,font=F(19,bold=(j==0)),fill=CREAM)
    yy+=30*len(wr)+18
y+=350

dr.text((44,y),'RESULTADOS DE HOY',font=FB(28),fill=GOLDB); y+=46
for p in d['partidos']:
    dr.rounded_rectangle([40,y,W-40,y+78],radius=14,fill=CARD,outline=GOLD,width=2)
    dr.text((64,y+12),p['h'],font=FB(25),fill=WHITE)
    dr.rounded_rectangle([W//2-58,y+10,W//2+58,y+46],radius=10,fill=GOLDB)
    dr.text((W//2,y+13),str(p['hs'])+' - '+str(p['as']),font=FB(26),fill=INK,anchor='ma')
    dr.text((W-64,y+12),p['a'],font=FB(25),fill=WHITE,anchor='ra')
    ex = ('CLAVARON: '+', '.join(p['exactos'])) if p['exactos'] else 'nadie clavo este (al cerdo)'
    dr.text((64,y+50),ex[:74],font=F(15,bold=False),fill=(GREEN if p['exactos'] else RED)); y+=90

y+=6
dr.text((44,y),'LOS PUNTEROS (casi todos arrimados)',font=FB(25),fill=GOLDB); y+=44
med=['1','2','3','4','5']
for i,r in enumerate(d['rows'][:5]):
    lead=i==0
    dr.rounded_rectangle([40,y,W-40,y+52],radius=12,fill=(GOLD if lead else (46,41,31)),outline=GOLD,width=2)
    col=INK if lead else WHITE
    dr.text((64,y+12),med[i],font=FB(24),fill=col)
    dr.text((108,y+12),r['nm'],font=FB(24),fill=col)
    dr.text((W-210,y+16),'Casa '+str(r['casa']),font=F(17),fill=(INK if lead else GOLDB))
    dr.text((W-64,y+10),str(r['total']),font=FB(28),fill=col,anchor='ra'); y+=62
last=d['rows'][-1]; y+=2
dr.rounded_rectangle([40,y,W-40,y+50],radius=12,fill=(64,32,30),outline=RED,width=2)
dr.text((64,y+12),'COLERO (va por el cerdo):',font=FB(22),fill=(255,205,196))
dr.text((W-64,y+12),last['nm']+' · '+str(last['total']),font=FB(22),fill=WHITE,anchor='ra'); y+=66
dr.text((W//2,y),'Bonny tomo el cargo. MFito llora en una esquina.',font=FB(22),fill=GOLDB,anchor='ma')
dr.text((W//2,H-44),'pollamundialnatillera.vercel.app',font=FB(20),fill=GOLD,anchor='ma')
img.save('/tmp/boletin-dia3.png'); print('OK',img.size)

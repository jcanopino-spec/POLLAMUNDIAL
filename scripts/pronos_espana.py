from PIL import Image, ImageDraw, ImageFont
import os, json, textwrap
d = json.load(open('/tmp/pesp.json'))
INK=(15,13,10); GOLD=(201,162,39); GOLDB=(245,211,99); CREAM=(245,238,222); WHITE=(255,255,255); GREEN=(74,200,130); BLUE=(110,170,240); ORANGE=(240,150,60); CARD=(38,34,26)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
rows=d['rows']; mt=d['mt']
loc=[r for r in rows if r['h']>r['a']]; emp=[r for r in rows if r['h']==r['a']]; vis=[r for r in rows if r['h']<r['a']]
for g in (loc,emp,vis): g.sort(key=lambda r:r['nm'].lower())
percol=max(len(loc),len(emp),len(vis),1)
W=1080; H=640+percol*46+250
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(24+t*8),int(20+t*6),int(14+t*4)))
dr.rectangle([12,12,W-12,H-12],outline=GOLD,width=4)
# Me Frito enguayabado arriba derecha (con gotas)
mf=Image.open('/tmp/mfito.png').convert('RGBA'); mh=300; mw=int(mf.width*mh/mf.height); mf=mf.resize((mw,mh))
img.paste(mf,(W-mw-6,46),mf)
dr=ImageDraw.Draw(img,'RGBA')
for (gx,gy) in [(W-mw+90,120),(W-mw+150,90),(W-110,110)]:
    dr.polygon([(gx,gy),(gx-16,gy+34),(gx+16,gy+34)],fill=(150,205,250,235),outline=(80,140,205))
    dr.ellipse([gx-16,gy+18,gx+16,gy+52],fill=(150,205,250,235),outline=(80,140,205))
img=img.convert('RGB'); dr=ImageDraw.Draw(img)
dr.text((46,48),'PRONOSTICOS DEL PARCHE',font=FB(34),fill=GOLDB)
dr.text((46,94),mt['h']+'  vs  '+mt['a'],font=FB(44),fill=WHITE)
dr.text((48,152),mt['hora'].upper()+' · Grupo H',font=F(22),fill=CREAM)
# nota del condor de Temu
dr.rounded_rectangle([40,196,W-40,196+74],radius=14,fill=(40,30,24),outline=GOLDB,width=2)
nota='A esta hora seguimos esperando las predicciones del CONDOR DE TEMU... debe estar enguayabado con su mentor en el Lleras. Igual no le atina a NADA.'
for j,ln in enumerate(textwrap.wrap(nota,width=72)[:3]):
    dr.text((58,206+j*22),ln,font=F(16,bold=(j==0)),fill=CREAM)
top=290
colw=(W-80)//3
heads=[('GANA ESPANA',ORANGE,loc),('EMPATE',BLUE,emp),('GANA CABO VERDE',GREEN,vis)]
for ci,(title,col,lst) in enumerate(heads):
    x=40+ci*colw
    dr.rounded_rectangle([x+4,top,x+colw-8,top+40],radius=10,fill=col)
    dr.text((x+colw//2,top+8),title+' ('+str(len(lst))+')',font=FB(17),fill=INK,anchor='ma')
    yy=top+52
    for r in lst:
        dr.rounded_rectangle([x+4,yy,x+colw-8,yy+40],radius=8,fill=CARD,outline=(60,52,38),width=1)
        dr.text((x+14,yy+3),r['nm'][:14],font=F(15),fill=WHITE)
        dr.text((x+colw-16,yy+8),str(r['h'])+'-'+str(r['a']),font=FB(19),fill=GOLDB,anchor='ra')
        yy+=46
y=top+52+percol*46+20
dr.rounded_rectangle([40,y,W-40,y+92],radius=14,fill=(40,30,24),outline=GOLDB,width=2)
dr.text((64,y+14),'PROFECIA DEL CONDOR DE TEMU:',font=FB(24),fill=GOLDB)
dr.text((64,y+50),'"...zzz..." (sigue dormido). Apuntenle a lo que quieran, el ave no aporta.',font=F(18,bold=False),fill=CREAM)
y+=104
dr.text((W//2,y),'El que clave el marcador: +5. Los demas, al club del cerdo con Me Frito',font=F(18),fill=WHITE,anchor='ma')
dr.text((W//2,H-44),'pollamundialnatillera.vercel.app',font=FB(20),fill=GOLD,anchor='ma')
img.save('/tmp/pronos-espana.png'); print('OK',img.size)

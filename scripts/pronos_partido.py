from PIL import Image, ImageDraw, ImageFont
import os, json
d = json.load(open('/tmp/p9.json'))
INK=(15,13,10); GOLD=(201,162,39); GOLDB=(245,211,99); CREAM=(245,238,222); WHITE=(255,255,255); GREEN=(74,200,130); BLUE=(110,170,240); ORANGE=(240,150,60); CARD=(38,34,26)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

rows=d['rows']
# clasificar por resultado (local gana / empate / visita gana)
loc=[r for r in rows if r['h']>r['a']]
emp=[r for r in rows if r['h']==r['a']]
vis=[r for r in rows if r['h']<r['a']]
for g in (loc,emp,vis): g.sort(key=lambda r:r['nm'].lower())

W=1080
H=560 + max(len(loc),1)*0 + (len(loc)+len(emp)+len(vis))*0  # placeholder
# calculamos altura: 3 columnas, fila por persona
percol=max(len(loc),len(emp),len(vis))
H=620 + percol*46 + 240
img=Image.new('RGB',(W,H),INK); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(24+t*8),int(20+t*6),int(14+t*4)))
dr.rectangle([12,12,W-12,H-12],outline=GOLD,width=4)

# MFito arriba derecha
mf=Image.open('/tmp/mfito.png').convert('RGBA'); mh=300; mw=int(mf.width*mh/mf.height); mf=mf.resize((mw,mh))
img.paste(mf,(W-mw-6,40),mf)
dr=ImageDraw.Draw(img)
dr.text((46,48),'PRONOSTICOS DEL PARCHE',font=FB(36),fill=GOLDB)
dr.text((46,96),'Costa de Marfil  vs  Ecuador',font=FB(46),fill=WHITE)
dr.text((48,158),'Dom 14 · 6:00 PM · Grupo F · antes del pitazo',font=F(22),fill=CREAM)
dr.text((48,196),'MFito ya profetizo... preparen el desastre',font=F(20,bold=False),fill=GOLDB)

# 3 columnas
top=270
colw=(W-80)//3
heads=[('GANA C. MARFIL',ORANGE,loc),('EMPATE',BLUE,emp),('GANA ECUADOR',GREEN,vis)]
for ci,(title,col,lst) in enumerate(heads):
    x=40+ci*colw
    dr.rounded_rectangle([x+4,top,x+colw-8,top+40],radius=10,fill=col)
    dr.text((x+colw//2,top+8),title+' ('+str(len(lst))+')',font=FB(18),fill=INK,anchor='ma')
    yy=top+52
    for r in lst:
        dr.rounded_rectangle([x+4,yy,x+colw-8,yy+40],radius=8,fill=CARD,outline=(60,52,38),width=1)
        nmtxt=r['nm'][:14]
        dr.text((x+14,yy+3),nmtxt,font=F(15),fill=WHITE)
        dr.text((x+colw-16,yy+8),str(r['h'])+'-'+str(r['a']),font=FB(19),fill=GOLDB,anchor='ra')
        yy+=46

y=top+52+percol*46+20
# franja MFito profecia
dr.rounded_rectangle([40,y,W-40,y+92],radius=14,fill=(40,30,24),outline=GOLDB,width=2)
dr.text((64,y+14),'PROFECIA OFICIAL DE MFITO:',font=FB(24),fill=GOLDB)
dr.text((64,y+50),'Costa de Marfil 6-4, goles del Baldor. Apuntenle a lo contrario y ganan.',font=F(18,bold=False),fill=CREAM)
y+=104
# pie
dr.text((W//2,y),'El que clave el marcador exacto: +5. Los demas, al club del cerdo con MFito',font=F(19),fill=WHITE,anchor='ma')
dr.text((W//2,H-44),'pollamundialnatillera.vercel.app',font=FB(20),fill=GOLD,anchor='ma')
img.save('/tmp/pronos-p9.png'); print('OK',img.size)

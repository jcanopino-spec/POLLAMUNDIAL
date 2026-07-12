from PIL import Image, ImageDraw, ImageFont
import os, hashlib

NAVY=(0,40,104); RED=(200,16,46); SILVER=(205,210,218); GRAY=(96,102,116); INK=(20,24,32)
WHITE=(255,255,255); BG=(26,32,46)
def FB(sz):
    p='/System/Library/Fonts/Supplemental/Arial Black.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()
def F(sz,bold=True):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf'; return ImageFont.truetype(p,sz) if os.path.exists(p) else ImageFont.load_default()

W,H=1500,820
img=Image.new('RGB',(W,H),BG); dr=ImageDraw.Draw(img)
for y in range(H):
    t=y/H; dr.line([(0,y),(W,y)],fill=(int(18+t*22),int(26+t*24),int(44+t*30)))

M=40
dr.rounded_rectangle([M,M,W-M,H-M],radius=26,fill=WHITE)
# franja superior
dr.rounded_rectangle([M,M,W-M,M+96],radius=26,fill=NAVY); dr.rectangle([M,M+64,W-M,M+96],fill=NAVY)
dr.text((M+34,M+22),'AMERICAM AIRLAN',font=FB(42),fill=WHITE)
dr.ellipse([M+430,M+30,M+430+40,M+30+40],outline=WHITE,width=3); dr.polygon([(M+444,M+38),(M+466,M+50),(M+444,M+62)],fill=RED)
dr.text((W-M-34,M+34),'PASE DE ABORDAR · BOARDING PASS',font=FB(22),fill=SILVER,anchor='ra')
dr.rectangle([M,M+96,W-M,M+103],fill=RED)

# perforación (talón derecho ~26%)
px=W-M-380
for yy in range(M+112,H-M-6,18): dr.line([(px,yy),(px,yy+9)],fill=SILVER,width=3)
dr.ellipse([px-16,M+96,px+16,M+128],fill=BG); dr.ellipse([px-16,H-M-32,px+16,H-M],fill=BG)

x0=M+36
# pasajero
y=M+128
dr.text((x0,y),'PASAJERO / PASSENGER',font=F(16,False),fill=GRAY)
dr.text((x0,y+24),'DELEGACIÓN POLLA DE ALAMEDA',font=FB(36),fill=INK)
dr.text((x0,y+72),'Edison · JuanMa · Jaime  (los que SÍ fueron 😎)',font=F(19,False),fill=GRAY)

# ruta MDE -> YVR
ry=y+130
dr.text((x0,ry),'MDE',font=FB(70),fill=NAVY)
dr.text((x0+10,ry+80),'Alameda',font=F(19),fill=GRAY)
yvrx=x0+740
dr.text((yvrx,ry),'YVR',font=FB(70),fill=NAVY,anchor='ra')
dr.text((yvrx,ry+80),'Vancouver, Canadá',font=F(19),fill=GRAY,anchor='ra')
# línea de ruta punteada + avión (triángulo rojo)
lx1,lx2=x0+205,yvrx-215; lyc=ry+42
for dx in range(lx1,lx2,24): dr.ellipse([dx-3,lyc-3,dx+3,lyc+3],fill=SILVER)
cxp=(lx1+lx2)//2
dr.polygon([(cxp-18,lyc-15),(cxp+22,lyc),(cxp-18,lyc+15),(cxp-8,lyc)],fill=RED)

# grid de campos
gy=ry+150
cols=[('VUELO','GOL-500'),('PUERTA','G0L'),('ABORDAJE','¡YA MISMO!'),('ASIENTO','1A · 1ª fila'),('CLASE','PRIMERA')]
cw=(px-x0-16)//len(cols)
for i,(k,v) in enumerate(cols):
    cx=x0+i*cw
    dr.text((cx,gy),k,font=F(15,False),fill=GRAY)
    dr.text((cx,gy+20),v,font=FB(22),fill=INK)

# caja TARIFA
ty=gy+72
dr.rounded_rectangle([x0,ty,px-26,ty+96],radius=14,fill=RED)
dr.text((x0+24,ty+16),'TARIFA POR CABEZA / FARE PER HEAD',font=F(16,False),fill=(255,214,214))
dr.text((x0+24,ty+40),'USD $500',font=FB(48),fill=WHITE)
dr.text((px-50,ty+22),'× CADA INTEGRANTE',font=FB(22),fill=WHITE,anchor='ra')
dr.text((px-50,ty+54),'DE LA POLLA (no negociable)',font=F(16,False),fill=(255,214,214),anchor='ra')

# pie: mascotas + humor
def head(path,x,size,yy):
    src='/Users/jacp/mundial2026-simulador/'+path
    if os.path.exists(src):
        m=Image.open(src).convert('RGBA').resize((size,size)); img.paste(m,(x,yy),m)
fy=ty+120
head('public/cerdino-head.png', x0, 60, fy-8)
head('public/mfito-head.png', x0+68, 60, fy-8)
dr.text((x0+146,fy),'🐷 Cerdiño: "El que no consigne, viaja en la bodega con el cerdo."',font=F(18),fill=GRAY)
dr.text((x0+146,fy+28),'🦅 MFito: "Clase PRIMERA la paga el parche. Ustedes el billete, yo el vuelo."',font=F(18),fill=GRAY)

# ===== TALÓN =====
sx=px+28
dr.text((sx,M+128),'AMERICAM AIRLAN',font=FB(20),fill=NAVY)
dr.text((sx,M+156),'BOARDING PASS',font=F(14,False),fill=GRAY)
stub=[('PASAJERO','POLLA ALAMEDA'),('RUTA','MDE → YVR'),('VUELO','GOL-500'),('ASIENTO','1A'),('TARIFA','USD $500')]
sy=M+192
for k,v in stub:
    dr.text((sx,sy),k,font=F(13,False),fill=GRAY); dr.text((sx,sy+16),v,font=FB(20),fill=INK); sy+=50
by=sy+8; bx=sx
for i in range(64):
    w=2+((int(hashlib.md5(str(i).encode()).hexdigest(),16)>>(i%7))&3)
    dr.rectangle([bx,by,bx+w,by+58],fill=INK); bx+=w+3
    if bx>W-M-36: break
dr.text((sx,by+64),'POLLA-2026-VANCOUVER',font=F(12,False),fill=GRAY)

img.save('/tmp/boarding-pass.png'); print('OK',img.size)

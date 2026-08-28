/**
 * THE COMPILER — escultura procedural da MilWeb (SDF raymarching, um quad).
 *
 * Uma máquina impossível de compilar interfaces: uma laje de vidro escuro
 * (o "núcleo"), placas metálicas assimétricas, uma lâmina de tinta, barras
 * de interface emissivas e, por dentro, um anel com dentes que nunca para.
 * Nada é asset: tudo é distância assinada, então os estados são só números.
 *
 * Uniforms de estado (todos 0–1, interpolados no JS):
 *   uAssemble  0 = fragmentos dispersos (boot)  1 = montada
 *   uSpread    afastamento das placas (kavita/aurex abrem, vertex fecha)
 *   uFlatten   achata em planos (vertex / collapsed)
 *   uWarm      tinta quente e bordas suaves (terral)
 *   uRingSpd   velocidade do anel interno (aurex acelera, collapsed para)
 *   uScan      linha de varredura emissiva (kavita)
 *   uCollapse  1 = vira uma linha horizontal (contact)
 *   uAnomaly   ruído/jitter (introdução, break)
 *   uLab       mistura com o Event Horizon (fundo tinta + buraco negro)
 *   uInk       0 = página em papel · 1 = página em tinta (dev mode / mundos escuros)
 *
 * Fora da esfera de contorno o pixel sai transparente sem marchar — o custo
 * é proporcional à área da escultura, não da tela.
 */
export const COMPILER_FRAG = `precision highp float;
varying vec2 vUv;
uniform vec2 uRes;uniform float uTime;uniform vec2 uPointer;uniform vec2 uCenter;uniform float uScale;
uniform float uAssemble,uSpread,uFlatten,uWarm,uRingSpd,uScan,uCollapse,uAnomaly,uLab,uInk,uSteps,uHorizonK;
uniform sampler2D uTex;

#define PAPER vec3(.949,.941,.918)
#define INK vec3(.067,.067,.067)
#define SIGNAL vec3(.718,1.,.216)
#define WARM vec3(.914,.878,.812)

mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}

// partes: 0 vidro · 1 metal · 2 tinta · 3 interface
vec2 map(vec3 p){
  float ex=1.-uAssemble;            // explosão dos fragmentos
  float sp=.85+uSpread*.6;          // afastamento das placas
  float fl=1.-uFlatten*.82;         // achatamento em Z
  float t=uTime;
  // jitter da anomalia: deslocamento de alta frequência, discreto
  p+=uAnomaly*.05*vec3(sin(t*37.+p.y*9.),cos(t*29.+p.x*7.),sin(t*43.));
  // pequena deriva orgânica quando montada
  p.xz*=rot(.12*sin(t*.35)*uAssemble);
  // --- núcleo: laje de vidro escuro inclinada
  vec3 q=p;q.xy*=rot(.42);q.yz*=rot(-.55);q.z*=1./fl;
  q+=ex*vec3(.9,-.5,.4);
  float core=sdBox(q,vec3(.56,.34,.07*fl))-.012;
  float d=core;float id=0.;
  // --- placa metálica superior, deslocada e girada
  vec3 a=p-vec3(.18,.36,-.12)*sp;a.xz*=rot(.9);a.xy*=rot(-.15);a+=ex*vec3(-1.1,.8,-.6);
  float plateA=sdBox(a,vec3(.82,.014,.44*fl))-.006;
  if(plateA<d){d=plateA;id=1.;}
  // --- lâmina de tinta vertical
  vec3 b=p-vec3(-.46,-.08,.22)*sp;b.yz*=rot(.35);b.xz*=rot(-.4);b+=ex*vec3(.7,-1.,.9);
  float plateB=sdBox(b,vec3(.02,.66,.5*fl))-.01;
  float dd=smin(d,plateB,.02*uWarm);
  if(plateB<d){id=2.;}
  d=dd;
  // --- barras de interface (3), emissivas
  vec3 c=p-vec3(.55,-.3,.1)*sp;c.xy*=rot(-.7);c+=ex*vec3(.4,-1.2,.2);
  float bar1=sdBox(c,vec3(.02,.02,.95));
  vec3 e=p-vec3(-.2,.55,-.3)*sp;e.yz*=rot(1.1);e.xy*=rot(.3);e+=ex*vec3(-.5,1.1,-.7);
  float bar2=sdBox(e,vec3(.9,.018,.018));
  vec3 f=p-vec3(.1,-.62,.35)*sp;f.xz*=rot(.5);f+=ex*vec3(1.,-.3,1.);
  float bar3=sdBox(f,vec3(.016,.016,.7));
  float bars=min(bar1,min(bar2,bar3));
  if(bars<d){d=bars;id=3.;}
  // --- anel interno com dentes (nunca para)
  vec3 r=p;r.xy*=rot(.42);r.yz*=rot(-.55);r.xz*=rot(t*(.35+uRingSpd*2.2));
  float ring=sdTorus(r,vec2(.27,.018));
  float teeth=1e3;
  for(int i=0;i<6;i++){vec3 g=r;g.xz*=rot(float(i)*1.0472);g.x-=.27;teeth=min(teeth,sdBox(g,vec3(.035,.05,.02)));}
  float mech=min(ring,teeth);
  if(mech<d){d=mech;id=1.;}
  // --- colapso: tudo vira uma linha horizontal
  float line=sdBox(p,vec3(1.35,.006,.006));
  d=mix(d,line,uCollapse);
  if(uCollapse>.5)id=3.;
  return vec2(d,id);
}
vec3 normal(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
// ambiente procedural: papel em cima, tinta embaixo, um rasgo de luz
vec3 env(vec3 d){
  vec3 top=mix(PAPER,WARM,uWarm);vec3 bottom=INK;
  vec3 c=mix(bottom,top,smoothstep(-.4,.6,d.y));
  c+=vec3(1.)*pow(max(0.,dot(d,normalize(vec3(.4,.7,.2)))),40.)*.8;
  c=mix(c,INK*.9,uInk*.8);
  return c;
}
// ---------- Event Horizon (Lab) ----------
float stars(vec2 uv){vec2 g=floor(uv*90.);vec2 f=fract(uv*90.)-.5;float h=hash(g);float s=smoothstep(.06,0.,length(f-(vec2(hash(g+1.7),hash(g+3.1))-.5)*.8))*step(.94,h);return s*(0.6+0.4*sin(uTime*2.+h*40.));}
vec3 horizon(vec2 uv){
  vec2 c=uPointer*.12;vec2 d=uv-c;float dist=length(d);float rs=.13;
  float bend=rs*rs*1.9/max(dist*dist,1e-4);vec2 warped=uv-normalize(d)*bend*.5;
  float bg=stars(warped+vec2(uTime*.01,0.));
  float ang=atan(d.y,d.x);
  float ring=smoothstep(.02,0.,abs(dist-rs*1.55)-.012)*(.55+.45*sin(ang*3.-uTime*1.6));
  float glow=exp(-pow((dist-rs*1.5)*9.,2.))*.35;
  float hole=smoothstep(rs,rs*1.02,dist);
  vec3 col=PAPER*bg*.9;col+=SIGNAL*(ring*uHorizonK+glow*.6);col*=hole;return col;
}

void main(){
  vec2 frag=gl_FragCoord.xy;
  vec2 uvScreen=frag/uRes;
  // fundo do Lab (opaco) quando uLab>0
  vec4 out0=vec4(0.);
  if(uLab>0.){vec2 huv=(frag-.5*uRes)/uRes.y;vec3 h=horizon(huv);out0=vec4(h*uLab,uLab);}
  // ---- câmera da escultura: posicionada em uCenter (0–1 da tela), raio uScale (fração da altura)
  vec2 uv=(frag-uCenter*uRes)/(uScale*uRes.y);
  float visible=1.-uLab*.0;
  if(uScale<.002||length(uv)>1.75){gl_FragColor=out0;return;}
  vec3 ro=vec3(0.,0.,3.4);
  vec3 rd=normalize(vec3(uv*.62,-1.));
  // atração magnética: a escultura se inclina rumo ao cursor
  vec2 m=uPointer*(.18*uAssemble);
  ro.xy+=m*1.2;rd.xy-=m*.25;rd=normalize(rd);
  // esfera de contorno
  float bb=dot(ro,rd);float cc=dot(ro,ro)-1.9*1.9;float disc=bb*bb-cc;
  if(disc<0.){gl_FragColor=out0;return;}
  float tmin=-bb-sqrt(disc);float tmax=-bb+sqrt(disc);
  float t=max(tmin,0.);vec2 h=vec2(0.);float hit=0.;
  for(int i=0;i<96;i++){
    if(float(i)>=uSteps||t>tmax)break;
    h=map(ro+rd*t);
    if(h.x<.0012){hit=1.;break;}
    t+=h.x*.9;
  }
  if(hit<.5){gl_FragColor=out0;return;}
  vec3 p=ro+rd*t;vec3 n=normal(p);
  vec3 L=normalize(vec3(.5,.8,.6));
  float diff=max(dot(n,L),0.);
  float fres=pow(1.-max(dot(n,-rd),0.),3.);
  vec3 R=reflect(rd,n);
  vec3 col;float alpha=1.;
  float id=h.y;
  vec3 paper=mix(PAPER,INK,uInk);vec3 ink=mix(INK,PAPER,uInk*.9);
  if(id<.5){
    // vidro escuro: refrata a interface atrás (textura da página) + reflexo fresnel
    vec3 rr=refract(rd,n,1./1.45);
    float chroma=.004+uAnomaly*.03;
    vec2 off=rr.xy*.13*uScale;
    vec2 tuv=uvScreen+off;
    float rch=texture2D(uTex,tuv+vec2(chroma,0.)).r;
    float gch=texture2D(uTex,tuv).g;
    float bch=texture2D(uTex,tuv-vec2(chroma,0.)).b;
    vec3 through=vec3(rch,gch,bch);
    vec3 tint=mix(vec3(.07,.07,.07),vec3(.22,.16,.1),uWarm);
    col=mix(through*.38+tint*.62,env(R),fres*.7)+diff*.05;
    // luz interna: as barras de interface iluminam o vidro por dentro
    col+=SIGNAL*.06*(.5+.5*sin(uTime*1.3+p.x*4.));
    // aresta viva
    col+=SIGNAL*smoothstep(.45,.9,fres)*.18*(1.-uWarm);
  }else if(id<1.5){
    // metal escovado
    vec3 e=env(R);
    float brush=.9+.1*sin((p.x+p.y)*140.);
    col=mix(vec3(.22,.22,.21)*brush,e,.5+fres*.45)+diff*.18+pow(max(dot(R,L),0.),30.)*.35;
    col=mix(col,col*vec3(1.02,.98,.9),uWarm);
  }else if(id<2.5){
    // tinta líquida: quase preta, especular alto
    vec3 base=mix(vec3(.05,.05,.05),vec3(.16,.09,.04),uWarm);
    col=base+env(R)*fres*.9+pow(max(dot(R,L),0.),60.)*.9;
  }else{
    // interface: emissiva, varredura
    float s=smoothstep(.02,0.,abs(fract(p.y*3.+uTime*.6)-.5)-.48)*uScan;
    col=mix(vec3(.85,.85,.82),SIGNAL,.55+.45*sin(uTime*3.+p.x*8.))*(.7+.3*diff);
    col=mix(col,SIGNAL,s);
    col=mix(col,ink,uCollapse*.6);
  }
  // varredura global do kavita atravessando a escultura
  float scanLine=smoothstep(.015,0.,abs(fract(uTime*.25)*2.6-1.3-p.y))*uScan;
  col=mix(col,SIGNAL,scanLine*.8);
  // colapso: só a linha, em tinta
  col=mix(col,ink,uCollapse*.5);
  // anomalia: rasgos de sinal
  col=mix(col,SIGNAL,step(.985,hash(floor(frag/vec2(2.,60.))+floor(uTime*20.)))*uAnomaly);
  vec4 sc=vec4(col*alpha,alpha);
  gl_FragColor=sc+out0*(1.-sc.a);
}`;

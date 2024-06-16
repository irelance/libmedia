"use strict";(self.webpackChunkAVPlayer=self.webpackChunkAVPlayer||[]).push([[791],{85947:(e,a,t)=>{t.d(a,{A:()=>s});var r=t(134);class s{constructor(){(0,r.A)(this,"type",-1),(0,r.A)(this,"onStreamAdd",void 0)}destroy(e){}}},3791:(e,a,t)=>{t.r(a),t.d(a,{default:()=>p});var r=t(134),s=t(61499),i=t(50932),c=t(4624),n=t(9705),o=t(85947),d=t(14686),u=t(37837),f=t(71517),h=t(35531),l=t(95644),R="src/avformat/formats/IWavFormat.ts";class p extends o.A{constructor(){super(),(0,r.A)(this,"type",9),(0,r.A)(this,"dataSize",void 0),(0,r.A)(this,"sampleCount",void 0),(0,r.A)(this,"pcmStartPos",void 0),(0,r.A)(this,"currentPts",void 0)}init(e){e.ioReader.setEndian(!1)}async readHeader(e){const a=await e.ioReader.readString(4);switch(a){case"RIFF":case"RF64":case"BW64":break;case"RIFX":e.ioReader.setEndian(!0);break;default:return c.z3("the file format is not wav",R,73),n.LR}await e.ioReader.skip(4);const t=await e.ioReader.readString(4);if("WAVE"!==t)return c.z3(`invalid start code ${t} in RIFF header`,R,83),n.LR;if("RF64"===a||"BW64"===a){if("ds64"!==await e.ioReader.readString(4))return n.LR;const a=await e.ioReader.readUint32();if(a<24)return n.LR;if(await e.ioReader.skip(8),this.dataSize=await e.ioReader.readUint64(),this.sampleCount=await e.ioReader.readUint64(),this.dataSize<0||this.sampleCount<0)return c.z3("negative data_size and/or sample_count in ds64",R,103),n.LR;await e.ioReader.skip(a-24)}const r=e.createStream(),i=await e.ioReader.fileSize();for(;e.ioReader.getPos()<i;){const a=await e.ioReader.readString(4),t=await e.ioReader.readUint32();if("fmt "===a){let a=await(0,h.y)(e.ioReader,r.codecpar[s.o9],t);if(a<0)return a}else if("data"===a){if(this.pcmStartPos=e.ioReader.getPos(),this.dataSize||(this.dataSize=BigInt(Math.floor(t))),this.pcmStartPos+this.dataSize===i)break;await e.ioReader.seek(this.pcmStartPos+this.dataSize)}else{if(this.pcmStartPos+this.dataSize===i)break;await e.ioReader.seek(e.ioReader.getPos()+BigInt(Math.floor(t)))}}return this.sampleCount||(this.sampleCount=(this.dataSize<<BigInt(3))/BigInt(r.codecpar.chLayout.nbChannels*(0,l.MZ)(r.codecpar.codecId))),r.timeBase.den=r.codecpar.sampleRate,r.timeBase.num=1,this.sampleCount&&(r.duration=this.sampleCount),this.currentPts=BigInt(0),await e.ioReader.seek(this.pcmStartPos),0}async readAVPacket(e,a){const t=e.streams.find((e=>e.codecpar.codecType=1));try{const r=1024*t.codecpar.chLayout.nbChannels*(0,l.MZ)(t.codecpar.codecId)>>>3,s=(0,u.sY)(r);return(0,f.NX)(a,s,r),i.M[17](a+16,this.currentPts),i.M[17](a+8,this.currentPts),i.M[17](a+56,e.ioReader.getPos()),await e.ioReader.readBuffer(r,(0,d.JW)(s,r)),i.M[15](a+32,t.index),i.M[15](a+76,t.timeBase.den),i.M[15](a+72,t.timeBase.num),this.currentPts+=BigInt(1024),0}catch(a){return-1048576!==e.ioReader.error&&c.z3(a.message,R,191),e.ioReader.error}}async seek(e,a,t,r){const s=e.ioReader.getPos();if(2&r){const i=await e.ioReader.fileSize();return i<=BigInt(0)?BigInt(n.E$):(t<BigInt(0)?t=BigInt(0):t>i&&(t=i),await e.ioReader.seek(t),4&r||(this.currentPts=(t-this.pcmStartPos<<BigInt(3))/BigInt(a.codecpar.chLayout.nbChannels*(0,l.MZ)(a.codecpar.codecId))),s)}{const r=this.pcmStartPos+(t*BigInt(a.codecpar.chLayout.nbChannels*(0,l.MZ)(a.codecpar.codecId))>>BigInt(3));return await e.ioReader.seek(r),this.currentPts=t,s}}getAnalyzeStreamsCount(){return 1}}},35531:(e,a,t)=>{t.d(a,{y:()=>l});var r=t(63939),s=t(50932),i=t(4624),c=t(9705),n=t(53260),o=t(95644),d=t(37837),u=t(14686),f=t(39381),h="src/avformat/formats/riff/iriff.ts";async function l(e,a,t){if(t<14)return i.z3("wav format size < 14",h,36),c.LR;s.M[15](a,1);const l=await e.readUint16();let R=await e.readUint16();const p=await e.readUint32();let w=8*await e.readUint32();const m=await e.readUint16();if(s.M[15](a+136,p),s.M[15](a+140,m),14===t?s.M[15](a+40,8):s.M[15](a+40,await e.readUint16()),65534===l?s.M[8](a+8,0):(s.M[8](a+8,l),s.M[15](a+4,function(e,a){let t=n.g[e];return t?(65541===t?t=(0,o.uU)(a,!1,!1,-2):65557===t&&(t=(0,o.uU)(a,!0,!1,0)),69633===t&&8===a&&(t=69676),t):0}(l,r.f[15](a+40)))),t>=18&&357!==l){let i=await e.readUint16();t-=18,i=Math.min(t,i),i>=22&&65534===l&&(await e.skip(22),i-=22,t-=22),i>0&&(s.M[20](a+12,(0,d.sY)(i)),s.M[15](a+16,i),await e.readBuffer(i,(0,u.JW)(r.f[20](a+12),i)),t-=i),t>0&&await e.skip(t)}else if(357===l&&t>=32){t-=4,s.M[20](a+12,(0,d.sY)(t)),s.M[15](a+16,t),await e.readBuffer(t,(0,u.JW)(r.f[20](a+12),t));const i=f.E3(r.f[20](a+12)+4);if(s.M[15](a+136,f.Y0(r.f[20](a+12)+12)),R=0,w=0,t<8+20*i)return c.LR;for(let e=0;e<i;e++)R+=r.f[2](r.f[20](a+12)+(8+20*e+17))}return s.M[17](a+32,BigInt(w)),r.f[15](a+136)<0?(i.z3(`Invalid sample rate: ${r.f[15](a+136)}`,h,116),c.LR):(86065===r.f[15](a+4)&&(R=0,s.M[15](a+136,0)),69643==r.f[15](a+4)&&r.f[15](a+136)&&s.M[15](a+40,(0|Number(0xffffffffn&r.f[17](a+32)))/r.f[15](a+136)),R!=r.f[15](a+116)&&(s.M[15](a+112,0),s.M[15](a+116,R)),0)}},53260:(e,a,t)=>{t.d(a,{g:()=>r});const r={1:65541,2:69638,3:65557,6:65543,7:65542,10:86052,16:69664,17:69633,23:69664,32:69646,34:86037,49:86046,50:86046,56:73728,66:86068,69:69643,20:69643,64:69643,97:69635,98:69634,100:69643,105:69633,117:86079,131:86069,255:86018,273:86068,5632:86018,5634:86065,8192:86019}},39381:(e,a,t)=>{t.d(a,{E3:()=>i,Y0:()=>c});var r=t(63939);function s(e){return r.f[2](e)}function i(e){return s(e+1)<<8|s(e)}function c(e){return i(e+2)<<16|i(e)}},95644:(e,a,t)=>{function r(e,a,t,r){if(e<=0||e>64)return 0;if(a)switch(e){case 32:return t?65556:65557;case 64:return t?65558:65559;default:return 0}else if(e+=7,r&1<<(e>>>=3)-1)switch(e){case 1:return 65540;case 2:return t?65537:65536;case 3:return t?65549:65548;case 4:return t?65545:65544;case 8:return t?65568:65567;default:return 0}else switch(e){case 1:return 65541;case 2:return t?65539:65538;case 3:return t?65551:65550;case 4:return t?65547:65546;default:return 0}}function s(e){switch(e){case 69649:return 2;case 69648:return 3;case 69647:case 69633:case 69632:case 69645:case 69638:return 4;default:return function(e){switch(e){case 86070:case 86071:case 69674:case 69644:case 69678:case 69651:case 69661:case 69677:case 69655:case 69664:case 69636:case 69675:case 69660:case 69646:case 69670:return 4;case 86089:case 86090:case 86091:case 86092:case 65543:case 65542:case 65571:case 65540:case 65563:case 65572:case 65541:case 81924:case 81926:return 8;case 65537:case 65566:case 65536:case 65554:case 65539:case 65538:return 16;case 65552:case 65549:case 65548:case 65564:case 65551:case 65550:return 24;case 65545:case 65544:case 65565:case 65547:case 65546:case 65556:case 65557:case 65570:case 65569:return 32;case 65558:case 65559:case 65568:case 65567:return 64;default:return 0}}(e)}}t.d(a,{MZ:()=>s,uU:()=>r})}}]);
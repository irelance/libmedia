"use strict";(self.webpackChunkAVTranscoder=self.webpackChunkAVTranscoder||[]).push([[611],{85947:(t,e,i)=>{i.d(e,{A:()=>s});var n=i(134);class s{constructor(){(0,n.A)(this,"type",-1),(0,n.A)(this,"onStreamAdd",void 0)}destroy(t){}}},85611:(t,e,i)=>{i.r(e),i.d(e,{default:()=>p});var n=i(134),s=i(50932),r=i(4624),a=i(9705),o=i(85947),c=i(14686),h=i(37837),u=i(71517),d=i(72739),f=i(50011),l=i(54825),g="src/avformat/formats/IWebVttFormat.ts";class p extends o.A{constructor(){super(),(0,n.A)(this,"type",15),(0,n.A)(this,"queue",void 0),(0,n.A)(this,"index",void 0)}init(t){this.queue=[]}async readChunk(t){let e="";const i=t.ioReader.getPos();for(;;){const i=await t.ioReader.readLine();if(""===i)break;e+=i+"\n"}return{chunk:e.trim(),pos:i}}async readHeader(t){const e=await t.ioReader.peekBuffer(3);if(239===e[0]&&187===e[1]&&191===e[2]&&await t.ioReader.skip(3),"WEBVTT"!==await t.ioReader.peekString(6))return r.z3("the file format is not vtt",g,89),a.LR;const i=t.createStream();i.codecpar.codecId=94226,i.codecpar.codecType=3,i.timeBase.den=1e3,i.timeBase.num=1;const n=await t.ioReader.readLine();n.indexOf("-")>0&&(i.metadata.title=n.split("-").pop().trim()),this.index=0;const s=[];let o=BigInt(0);try{for(;;){const{chunk:e,pos:n}=await this.readChunk(t);if(""===e||/^NOTE/.test(e))continue;/^STYLE/.test(e)&&s.push({style:e.replace(/STYLE[\s|\n]?/,""),pos:n});const r=e.split("\n");let a,c;-1===r[0].indexOf("--\x3e")&&(a=r.shift().trim());let h=r.shift().split("--\x3e");const u=(0,l.j)(h.shift());h=h.shift().trim().split(" ");const f=(0,l.j)(h.shift());if(f<=u)continue;h=h.filter((t=>""!==t)),h.length&&(c=h.join(" "));const g=r.join("\n").trim();if(!g)continue;i.nbFrames++,i.duration=f;const p={identifier:a,options:c,context:g,startTs:u,endTs:f,pos:n};u>=o?(this.queue.push(p),o=u):d._(this.queue,p,(t=>t.startTs<t.startTs?1:-1))}}catch(t){return i.metadata.styles=s,0}}async readAVPacket(t,e){if(!this.queue.length)return a.LR;if(this.index>=this.queue.length)return-1048576;const i=t.streams.find((t=>3===t.codecpar.codecType)),n=this.queue[this.index++];if(s.M[15](e+32,i.index),s.M[15](e+76,i.timeBase.den),s.M[15](e+72,i.timeBase.num),s.M[17](e+16,n.startTs),s.M[17](e+8,n.startTs),s.M[17](e+48,n.endTs-n.startTs),n.identifier){const t=f.encode(n.identifier),i=(0,h.sY)(t.length);(0,c.lW)(i,t.length,t),(0,u.Ow)(e,16,i,t.length)}if(n.options){const t=f.encode(n.options),i=(0,h.sY)(t.length);(0,c.lW)(i,t.length,t),(0,u.Ow)(e,17,i,t.length)}const r=f.encode(n.context),o=(0,h.sY)(r.length);return(0,c.lW)(o,r.length,r),(0,u.NX)(e,o,r.length),0}async seek(t,e,i,n){if(2&n)return BigInt(a.E$);if(i<=BigInt(0))return this.index=0,BigInt(0);const s=d.El(this.queue,(t=>t.startTs>i?-1:1));return s>=0?(r.Yz(`seek in cues, found index: ${s}, pts: ${this.queue[s].startTs}, pos: ${this.queue[s].pos}`,g,256),this.index=Math.max(s-1,0),BigInt(0)):BigInt(a.LR)}getAnalyzeStreamsCount(){return 1}}},54825:(t,e,i)=>{function n(t){if(!(t=t.trim()))return-BigInt(1);let e=t.split(":"),i=BigInt(0);return 3===e.length&&(i+=BigInt(+e.shift().trim())*BigInt(36e5)),i+=BigInt(+e.shift().trim())*BigInt(6e4),e=e.shift().trim().split("."),i+=BigInt(+e.shift().trim())*BigInt(1e3),i+=BigInt(+e.shift().trim()),i}function s(t){if(!(t=t.trim()))return-BigInt(1);let e=t.split(":"),i=BigInt(0);return 3===e.length&&(i+=BigInt(+e.shift().trim())*BigInt(36e5)),i+=BigInt(+e.shift().trim())*BigInt(6e4),e=e.shift().trim().split(","),i+=BigInt(+e.shift().trim())*BigInt(1e3),i+=BigInt(+e.shift().trim()),i}i.d(e,{j:()=>n,t:()=>s})}}]);
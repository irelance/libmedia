"use strict";(self.webpackChunkAVPlayer=self.webpackChunkAVPlayer||[]).push([[611],{85947:(t,e,n)=>{n.d(e,{A:()=>s});var r=n(78716),i=n(81570),a=n(134),s=function(){function t(){(0,r.A)(this,t),(0,a.A)(this,"type",-1),(0,a.A)(this,"onStreamAdd",void 0)}return(0,i.A)(t,[{key:"destroy",value:function(t){}}]),t}()},85611:(t,e,n)=>{n.r(e),n.d(e,{default:()=>R});var r=n(88435),i=n.n(r),a=n(25182),s=n(78716),u=n(81570),c=n(77193),o=n(25767),f=n(43070),p=n(31060),h=n(134),d=n(36443),l=n.n(d),g=n(50932),k=n(4624),m=n(9705),x=n(85947),b=n(14686),v=n(37837),B=n(71517),A=n(72739),I=n(50011),y=n(54825);function T(t,e,n){return e=(0,o.A)(e),(0,c.A)(t,w()?i()(e,n||[],(0,o.A)(t).constructor):e.apply(t,n))}function w(){try{var t=!Boolean.prototype.valueOf.call(i()(Boolean,[],(function(){})))}catch(t){}return(w=function(){return!!t})()}var q="src/avformat/formats/IWebVttFormat.ts",R=function(t){function e(){var t;return(0,s.A)(this,e),t=T(this,e),(0,h.A)((0,f.A)(t),"type",15),(0,h.A)((0,f.A)(t),"queue",void 0),(0,h.A)((0,f.A)(t),"index",void 0),t}var n,r,i,c;return(0,p.A)(e,t),(0,u.A)(e,[{key:"init",value:function(t){this.queue=[]}},{key:"readChunk",value:(c=(0,a.A)(l().mark((function t(e){var n,r,i;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:n="",r=e.ioReader.getPos();case 2:return t.next=5,e.ioReader.readLine();case 5:if(""!==(i=t.sent)){t.next=8;break}return t.abrupt("break",11);case 8:n+=i+"\n",t.next=2;break;case 11:return t.abrupt("return",{chunk:n.trim(),pos:r});case 12:case"end":return t.stop()}}),t)}))),function(t){return c.apply(this,arguments)})},{key:"readHeader",value:(i=(0,a.A)(l().mark((function t(e){var n,r,i,a,s,u,c,o,f,p,h,d,g,x,b,v;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.ioReader.peekBuffer(3);case 2:if(239!==(n=t.sent)[0]||187!==n[1]||191!==n[2]){t.next=6;break}return t.next=6,e.ioReader.skip(3);case 6:return t.next=8,e.ioReader.peekString(6);case 8:if("WEBVTT"===t.sent){t.next=12;break}return k.z3("the file format is not vtt",q,89),t.abrupt("return",m.LR);case 12:return(r=e.createStream()).codecpar.codecId=94226,r.codecpar.codecType=3,r.timeBase.den=1e3,r.timeBase.num=1,t.next=19,e.ioReader.readLine();case 19:(i=t.sent).indexOf("-")>0&&(r.metadata.title=i.split("-").pop().trim()),this.index=0,a=[],s=BigInt(0),t.prev=24;case 25:return t.next=28,this.readChunk(e);case 28:if(u=t.sent,c=u.chunk,o=u.pos,""!==c&&!/^NOTE/.test(c)){t.next=33;break}return t.abrupt("continue",25);case 33:if(/^STYLE/.test(c)&&a.push({style:c.replace(/STYLE[\s|\n]?/,""),pos:o}),f=c.split("\n"),p=void 0,h=void 0,-1===f[0].indexOf("--\x3e")&&(p=f.shift().trim()),d=f.shift().split("--\x3e"),g=(0,y.j)(d.shift()),d=d.shift().trim().split(" "),!((x=(0,y.j)(d.shift()))<=g)){t.next=44;break}return t.abrupt("continue",25);case 44:if((d=d.filter((function(t){return""!==t}))).length&&(h=d.join(" ")),b=f.join("\n").trim()){t.next=49;break}return t.abrupt("continue",25);case 49:r.nbFrames++,r.duration=x,v={identifier:p,options:h,context:b,startTs:g,endTs:x,pos:o},g>=s?(this.queue.push(v),s=g):A._(this.queue,v,(function(t){return t.startTs<t.startTs?1:-1})),t.next=25;break;case 55:t.next=61;break;case 57:return t.prev=57,t.t0=t.catch(24),r.metadata.styles=a,t.abrupt("return",0);case 61:case"end":return t.stop()}}),t,this,[[24,57]])}))),function(t){return i.apply(this,arguments)})},{key:"readAVPacket",value:(r=(0,a.A)(l().mark((function t(e,n){var r,i,a,s,u,c,o,f;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(this.queue.length){t.next=2;break}return t.abrupt("return",m.LR);case 2:if(!(this.index>=this.queue.length)){t.next=4;break}return t.abrupt("return",-1048576);case 4:return r=e.streams.find((function(t){return 3===t.codecpar.codecType})),i=this.queue[this.index++],g.M[15](n+32,r.index),g.M[15](n+76,r.timeBase.den),g.M[15](n+72,r.timeBase.num),g.M[17](n+16,i.startTs),g.M[17](n+8,i.startTs),g.M[17](n+48,i.endTs-i.startTs),i.identifier&&(a=I.encode(i.identifier),s=(0,v.sY)(a.length),(0,b.lW)(s,a.length,a),(0,B.Ow)(n,16,s,a.length)),i.options&&(u=I.encode(i.options),c=(0,v.sY)(u.length),(0,b.lW)(c,u.length,u),(0,B.Ow)(n,17,c,u.length)),o=I.encode(i.context),f=(0,v.sY)(o.length),(0,b.lW)(f,o.length,o),(0,B.NX)(n,f,o.length),t.abrupt("return",0);case 18:case"end":return t.stop()}}),t,this)}))),function(t,e){return r.apply(this,arguments)})},{key:"seek",value:(n=(0,a.A)(l().mark((function t(e,n,r,i){var a;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!(2&i)){t.next=2;break}return t.abrupt("return",BigInt(m.E$));case 2:if(!(r<=BigInt(0))){t.next=5;break}return this.index=0,t.abrupt("return",BigInt(0));case 5:if(!((a=A.El(this.queue,(function(t){return t.startTs>r?-1:1})))>=0)){t.next=10;break}return k.Yz("seek in cues, found index: ".concat(a,", pts: ").concat(this.queue[a].startTs,", pos: ").concat(this.queue[a].pos),q,256),this.index=Math.max(a-1,0),t.abrupt("return",BigInt(0));case 10:return t.abrupt("return",BigInt(m.LR));case 11:case"end":return t.stop()}}),t,this)}))),function(t,e,r,i){return n.apply(this,arguments)})},{key:"getAnalyzeStreamsCount",value:function(){return 1}}]),e}(x.A)},54825:(t,e,n)=>{function r(t){if(!(t=t.trim()))return-BigInt(1);var e=t.split(":"),n=BigInt(0);return 3===e.length&&(n+=BigInt(+e.shift().trim())*BigInt(36e5)),n+=BigInt(+e.shift().trim())*BigInt(6e4),e=e.shift().trim().split("."),(n+=BigInt(+e.shift().trim())*BigInt(1e3))+BigInt(+e.shift().trim())}function i(t){if(!(t=t.trim()))return-BigInt(1);var e=t.split(":"),n=BigInt(0);return 3===e.length&&(n+=BigInt(+e.shift().trim())*BigInt(36e5)),n+=BigInt(+e.shift().trim())*BigInt(6e4),e=e.shift().trim().split(","),(n+=BigInt(+e.shift().trim())*BigInt(1e3))+BigInt(+e.shift().trim())}n.d(e,{j:()=>r,t:()=>i})}}]);
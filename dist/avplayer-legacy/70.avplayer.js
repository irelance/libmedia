"use strict";(self.webpackChunkAVPlayer=self.webpackChunkAVPlayer||[]).push([[70],{85947:(t,e,n)=>{n.d(e,{A:()=>a});var r=n(78716),i=n(81570),u=n(134),a=function(){function t(){(0,r.A)(this,t),(0,u.A)(this,"type",-1),(0,u.A)(this,"onStreamAdd",void 0)}return(0,i.A)(t,[{key:"destroy",value:function(t){}}]),t}()},78070:(t,e,n)=>{n.r(e),n.d(e,{default:()=>q});var r=n(88435),i=n.n(r),u=n(25182),a=n(78716),s=n(81570),c=n(77193),o=n(25767),f=n(43070),h=n(31060),p=n(134),d=n(36443),l=n.n(d),g=n(50932),k=n(4624),m=n(9705),b=n(85947),v=n(14686),B=n(37837),x=n(71517),A=n(72739),I=n(50011),y=n(54825);function T(t,e,n){return e=(0,o.A)(e),(0,c.A)(t,w()?i()(e,n||[],(0,o.A)(t).constructor):e.apply(t,n))}function w(){try{var t=!Boolean.prototype.valueOf.call(i()(Boolean,[],(function(){})))}catch(t){}return(w=function(){return!!t})()}var q=function(t){function e(){var t;return(0,a.A)(this,e),t=T(this,e),(0,p.A)((0,f.A)(t),"type",16),(0,p.A)((0,f.A)(t),"queue",void 0),(0,p.A)((0,f.A)(t),"index",void 0),t}var n,r,i,c;return(0,h.A)(e,t),(0,s.A)(e,[{key:"init",value:function(t){this.queue=[]}},{key:"readChunk",value:(c=(0,u.A)(l().mark((function t(e){var n,r,i;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:n="",r=e.ioReader.getPos();case 2:return t.next=5,e.ioReader.readLine();case 5:if(""!==(i=t.sent)){t.next=8;break}return t.abrupt("break",11);case 8:n+=i+"\n",t.next=2;break;case 11:return t.abrupt("return",{chunk:n.trim(),pos:r});case 12:case"end":return t.stop()}}),t)}))),function(t){return c.apply(this,arguments)})},{key:"readHeader",value:(i=(0,u.A)(l().mark((function t(e){var n,r,i,u,a,s,c,o,f,h,p,d;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:(n=e.createStream()).codecpar.codecId=94225,n.codecpar.codecType=3,n.timeBase.den=1e3,n.timeBase.num=1,this.index=0,r=BigInt(0),t.prev=7;case 8:return t.next=11,this.readChunk(e);case 11:if(i=t.sent,u=i.chunk,a=i.pos,""!==u){t.next=16;break}return t.abrupt("continue",8);case 16:if(s=u.split("\n"),c=s.shift().trim(),o=s.shift().split(/--?>/),f=(0,y.t)(o[0]),!((h=(0,y.t)(o[1]))<=f)){t.next=23;break}return t.abrupt("continue",8);case 23:if(p=s.join("\n").trim()){t.next=26;break}return t.abrupt("continue",8);case 26:n.nbFrames++,n.duration=h,d={identifier:c,context:p,startTs:f,endTs:h,pos:a},f>=r?(this.queue.push(d),r=f):A._(this.queue,d,(function(t){return t.startTs<t.startTs?1:-1})),t.next=8;break;case 32:t.next=37;break;case 34:return t.prev=34,t.t0=t.catch(7),t.abrupt("return",0);case 37:case"end":return t.stop()}}),t,this,[[7,34]])}))),function(t){return i.apply(this,arguments)})},{key:"readAVPacket",value:(r=(0,u.A)(l().mark((function t(e,n){var r,i,u,a,s,c;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(this.queue.length){t.next=2;break}return t.abrupt("return",m.LR);case 2:if(!(this.index>=this.queue.length)){t.next=4;break}return t.abrupt("return",-1048576);case 4:return r=e.streams.find((function(t){return 3===t.codecpar.codecType})),i=this.queue[this.index++],g.M[15](n+32,r.index),g.M[15](n+76,r.timeBase.den),g.M[15](n+72,r.timeBase.num),g.M[17](n+16,i.startTs),g.M[17](n+8,i.startTs),g.M[17](n+48,i.endTs-i.startTs),i.identifier&&(u=I.encode(i.identifier),a=(0,B.sY)(u.length),(0,v.lW)(a,u.length,u),(0,x.Ow)(n,16,a,u.length)),s=I.encode(i.context),c=(0,B.sY)(s.length),(0,v.lW)(c,s.length,s),(0,x.NX)(n,c,s.length),t.abrupt("return",0);case 17:case"end":return t.stop()}}),t,this)}))),function(t,e){return r.apply(this,arguments)})},{key:"seek",value:(n=(0,u.A)(l().mark((function t(e,n,r,i){var u;return l().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!(2&i)){t.next=2;break}return t.abrupt("return",BigInt(m.E$));case 2:if(!(r<=BigInt(0))){t.next=5;break}return this.index=0,t.abrupt("return",BigInt(0));case 5:if(!((u=A.El(this.queue,(function(t){return t.startTs>r?-1:1})))>=0)){t.next=10;break}return k.Yz("seek in cues, found index: ".concat(u,", pts: ").concat(this.queue[u].startTs,", pos: ").concat(this.queue[u].pos),"src/avformat/formats/ISubRipFormat.ts",201),this.index=Math.max(u-1,0),t.abrupt("return",BigInt(0));case 10:return t.abrupt("return",BigInt(m.LR));case 11:case"end":return t.stop()}}),t,this)}))),function(t,e,r,i){return n.apply(this,arguments)})},{key:"getAnalyzeStreamsCount",value:function(){return 1}}]),e}(b.A)},54825:(t,e,n)=>{function r(t){if(!(t=t.trim()))return-BigInt(1);var e=t.split(":"),n=BigInt(0);return 3===e.length&&(n+=BigInt(+e.shift().trim())*BigInt(36e5)),n+=BigInt(+e.shift().trim())*BigInt(6e4),e=e.shift().trim().split("."),(n+=BigInt(+e.shift().trim())*BigInt(1e3))+BigInt(+e.shift().trim())}function i(t){if(!(t=t.trim()))return-BigInt(1);var e=t.split(":"),n=BigInt(0);return 3===e.length&&(n+=BigInt(+e.shift().trim())*BigInt(36e5)),n+=BigInt(+e.shift().trim())*BigInt(6e4),e=e.shift().trim().split(","),(n+=BigInt(+e.shift().trim())*BigInt(1e3))+BigInt(+e.shift().trim())}n.d(e,{j:()=>r,t:()=>i})}}]);
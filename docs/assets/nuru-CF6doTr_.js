const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index.esm-B_ZjuLrV.js","assets/index-DNzhl6ID.js","assets/index-CQ0o3Qhi.css","assets/provider-jsonrpc-CWGeEGEu.js","assets/index.esm-6SeMM0ub.js"])))=>i.map(i=>d[i]);
import{a5 as ue,a6 as A,a7 as Ne,a8 as xe,a9 as de}from"./index-DNzhl6ID.js";import{J as Pe}from"./provider-jsonrpc-CWGeEGEu.js";const $e=()=>{};var K={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const le=function(t){const e=[];let n=0;for(let r=0;r<t.length;r++){let s=t.charCodeAt(r);s<128?e[n++]=s:s<2048?(e[n++]=s>>6|192,e[n++]=s&63|128):(s&64512)===55296&&r+1<t.length&&(t.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(t.charCodeAt(++r)&1023),e[n++]=s>>18|240,e[n++]=s>>12&63|128,e[n++]=s>>6&63|128,e[n++]=s&63|128):(e[n++]=s>>12|224,e[n++]=s>>6&63|128,e[n++]=s&63|128)}return e},He=function(t){const e=[];let n=0,r=0;for(;n<t.length;){const s=t[n++];if(s<128)e[r++]=String.fromCharCode(s);else if(s>191&&s<224){const a=t[n++];e[r++]=String.fromCharCode((s&31)<<6|a&63)}else if(s>239&&s<365){const a=t[n++],i=t[n++],c=t[n++],u=((s&7)<<18|(a&63)<<12|(i&63)<<6|c&63)-65536;e[r++]=String.fromCharCode(55296+(u>>10)),e[r++]=String.fromCharCode(56320+(u&1023))}else{const a=t[n++],i=t[n++];e[r++]=String.fromCharCode((s&15)<<12|(a&63)<<6|i&63)}}return e.join("")},he={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<t.length;s+=3){const a=t[s],i=s+1<t.length,c=i?t[s+1]:0,u=s+2<t.length,d=u?t[s+2]:0,g=a>>2,f=(a&3)<<4|c>>4;let o=(c&15)<<2|d>>6,h=d&63;u||(h=64,i||(o=64)),r.push(n[g],n[f],n[o],n[h])}return r.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(le(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):He(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<t.length;){const a=n[t.charAt(s++)],c=s<t.length?n[t.charAt(s)]:0;++s;const d=s<t.length?n[t.charAt(s)]:64;++s;const f=s<t.length?n[t.charAt(s)]:64;if(++s,a==null||c==null||d==null||f==null)throw new Le;const o=a<<2|c>>4;if(r.push(o),d!==64){const h=c<<4&240|d>>2;if(r.push(h),f!==64){const p=d<<6&192|f;r.push(p)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class Le extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const ke=function(t){const e=le(t);return he.encodeByteArray(e,!0)},B=function(t){return ke(t).replace(/\./g,"")},Fe=function(t){try{return he.decodeString(t,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ue(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const je=()=>Ue().__FIREBASE_DEFAULTS__,Ve=()=>{if(typeof process>"u"||typeof K>"u")return;const t=K.__FIREBASE_DEFAULTS__;if(t)return JSON.parse(t)},ze=()=>{if(typeof document>"u")return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=t&&Fe(t[1]);return e&&JSON.parse(e)},N=()=>{try{return $e()||je()||Ve()||ze()}catch(t){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${t}`);return}},We=t=>{var e,n;return(n=(e=N())==null?void 0:e.emulatorHosts)==null?void 0:n[t]},Rn=t=>{const e=We(t);if(!e)return;const n=e.lastIndexOf(":");if(n<=0||n+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(n+1),10);return e[0]==="["?[e.substring(1,n-1),r]:[e.substring(0,n),r]},fe=()=>{var t;return(t=N())==null?void 0:t.config},Mn=t=>{var e;return(e=N())==null?void 0:e[`_${t}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ge{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}wrapCallback(e){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(n):e(n,r))}}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Je(t){try{return(t.startsWith("http://")||t.startsWith("https://")?new URL(t).hostname:t).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Nn(t){return(await fetch(t,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xn(t,e){if(t.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n={alg:"none",type:"JWT"},r=e||"demo-project",s=t.iat||0,a=t.sub||t.user_id;if(!a)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const i={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:a,user_id:a,firebase:{sign_in_provider:"custom",identities:{}},...t};return[B(JSON.stringify(n)),B(JSON.stringify(i)),""].join(".")}const v={};function qe(){const t={prod:[],emulator:[]};for(const e of Object.keys(v))v[e]?t.emulator.push(e):t.prod.push(e);return t}function Ke(t){let e=document.getElementById(t),n=!1;return e||(e=document.createElement("div"),e.setAttribute("id",t),n=!0),{created:n,element:e}}let Z=!1;function Pn(t,e){if(typeof window>"u"||typeof document>"u"||!Je(window.location.host)||v[t]===e||v[t]||Z)return;v[t]=e;function n(o){return`__firebase__banner__${o}`}const r="__firebase__banner",a=qe().prod.length>0;function i(){const o=document.getElementById(r);o&&o.remove()}function c(o){o.style.display="flex",o.style.background="#7faaf0",o.style.position="fixed",o.style.bottom="5px",o.style.left="5px",o.style.padding=".5em",o.style.borderRadius="5px",o.style.alignItems="center"}function u(o,h){o.setAttribute("width","24"),o.setAttribute("id",h),o.setAttribute("height","24"),o.setAttribute("viewBox","0 0 24 24"),o.setAttribute("fill","none"),o.style.marginLeft="-6px"}function d(){const o=document.createElement("span");return o.style.cursor="pointer",o.style.marginLeft="16px",o.style.fontSize="24px",o.innerHTML=" &times;",o.onclick=()=>{Z=!0,i()},o}function g(o,h){o.setAttribute("id",h),o.innerText="Learn more",o.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",o.setAttribute("target","__blank"),o.style.paddingLeft="5px",o.style.textDecoration="underline"}function f(){const o=Ke(r),h=n("text"),p=document.getElementById(h)||document.createElement("span"),b=n("learnmore"),J=document.getElementById(b)||document.createElement("a"),q=n("preprendIcon"),S=document.getElementById(q)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(o.created){const x=o.element;c(x),g(J,b);const Me=d();u(S,q),x.append(S,p,J,Me),document.body.appendChild(x)}a?(p.innerText="Preview backend disconnected.",S.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(S.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,p.innerText="Preview backend running in this workspace."),p.setAttribute("id",h)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",f):f()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pe(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function $n(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(pe())}function me(){var e;const t=(e=N())==null?void 0:e.forceEnvironment;if(t==="node")return!0;if(t==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Hn(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Ln(){const t=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof t=="object"&&t.id!==void 0}function kn(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Fn(){const t=pe();return t.indexOf("MSIE ")>=0||t.indexOf("Trident/")>=0}function Un(){return!me()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function jn(){return!me()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function Ze(){try{return typeof indexedDB=="object"}catch{return!1}}function Ye(){return new Promise((t,e)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),n||self.indexedDB.deleteDatabase(r),t(!0)},s.onupgradeneeded=()=>{n=!1},s.onerror=()=>{var a;e(((a=s.error)==null?void 0:a.message)||"")}}catch(n){e(n)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe="FirebaseError";class I extends Error{constructor(e,n,r){super(n),this.code=e,this.customData=r,this.name=Xe,Object.setPrototypeOf(this,I.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ge.prototype.create)}}class ge{constructor(e,n,r){this.service=e,this.serviceName=n,this.errors=r}create(e,...n){const r=n[0]||{},s=`${this.service}/${e}`,a=this.errors[e],i=a?Qe(a,r):"Error",c=`${this.serviceName}: ${i} (${s}).`;return new I(s,c,r)}}function Qe(t,e){return t.replace(et,(n,r)=>{const s=e[r];return s!=null?String(s):`<${r}?>`})}const et=/\{\$([^}]+)}/g;function Vn(t){for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e))return!1;return!0}function F(t,e){if(t===e)return!0;const n=Object.keys(t),r=Object.keys(e);for(const s of n){if(!r.includes(s))return!1;const a=t[s],i=e[s];if(Y(a)&&Y(i)){if(!F(a,i))return!1}else if(a!==i)return!1}for(const s of r)if(!n.includes(s))return!1;return!0}function Y(t){return t!==null&&typeof t=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zn(t){const e=[];for(const[n,r]of Object.entries(t))Array.isArray(r)?r.forEach(s=>{e.push(encodeURIComponent(n)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(n)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function Wn(t){const e={};return t.replace(/^\?/,"").split("&").forEach(r=>{if(r){const[s,a]=r.split("=");e[decodeURIComponent(s)]=decodeURIComponent(a)}}),e}function Gn(t){const e=t.indexOf("?");if(!e)return"";const n=t.indexOf("#",e);return t.substring(e,n>0?n:void 0)}function Jn(t,e){const n=new tt(t,e);return n.subscribe.bind(n)}class tt{constructor(e,n){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=n,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(n=>{n.next(e)})}error(e){this.forEachObserver(n=>{n.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,n,r){let s;if(e===void 0&&n===void 0&&r===void 0)throw new Error("Missing Observer.");nt(e,["next","error","complete"])?s=e:s={next:e,error:n,complete:r},s.next===void 0&&(s.next=P),s.error===void 0&&(s.error=P),s.complete===void 0&&(s.complete=P);const a=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),a}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let n=0;n<this.observers.length;n++)this.sendOne(n,e)}sendOne(e,n){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{n(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function nt(t,e){if(typeof t!="object"||t===null)return!1;for(const n of e)if(n in t&&typeof t[n]=="function")return!0;return!1}function P(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qn(t){return t&&t._delegate?t._delegate:t}class T{constructor(e,n,r){this.name=e,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const E="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rt{constructor(e,n){this.name=e,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const r=new Ge;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:n});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(e){const n=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(at(e))try{this.getOrInitializeService({instanceIdentifier:E})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(n);try{const a=this.getOrInitializeService({instanceIdentifier:s});r.resolve(a)}catch{}}}}clearInstance(e=E){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...e.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=E){return this.instances.has(e)}getOptions(e=E){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:n={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[a,i]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(a);r===c&&i.resolve(s)}return s}onInit(e,n){const r=this.normalizeInstanceIdentifier(n),s=this.onInitCallbacks.get(r)??new Set;s.add(e),this.onInitCallbacks.set(r,s);const a=this.instances.get(r);return a&&e(a,r),()=>{s.delete(e)}}invokeOnInitCallbacks(e,n){const r=this.onInitCallbacks.get(n);if(r)for(const s of r)try{s(e,n)}catch{}}getOrInitializeService({instanceIdentifier:e,options:n={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:st(e),options:n}),this.instances.set(e,r),this.instancesOptions.set(e,n),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=E){return this.component?this.component.multipleInstances?e:E:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function st(t){return t===E?void 0:t}function at(t){return t.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const n=this.getProvider(e.name);if(n.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);n.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const n=new rt(e,this);return this.providers.set(e,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var l;(function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT"})(l||(l={}));const ot={debug:l.DEBUG,verbose:l.VERBOSE,info:l.INFO,warn:l.WARN,error:l.ERROR,silent:l.SILENT},ct=l.INFO,ut={[l.DEBUG]:"log",[l.VERBOSE]:"log",[l.INFO]:"info",[l.WARN]:"warn",[l.ERROR]:"error"},dt=(t,e,...n)=>{if(e<t.logLevel)return;const r=new Date().toISOString(),s=ut[e];if(s)console[s](`[${r}]  ${t.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class lt{constructor(e){this.name=e,this._logLevel=ct,this._logHandler=dt,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in l))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?ot[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,l.DEBUG,...e),this._logHandler(this,l.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,l.VERBOSE,...e),this._logHandler(this,l.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,l.INFO,...e),this._logHandler(this,l.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,l.WARN,...e),this._logHandler(this,l.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,l.ERROR,...e),this._logHandler(this,l.ERROR,...e)}}const ht=(t,e)=>e.some(n=>t instanceof n);let X,Q;function ft(){return X||(X=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function pt(){return Q||(Q=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const be=new WeakMap,U=new WeakMap,ye=new WeakMap,$=new WeakMap,G=new WeakMap;function mt(t){const e=new Promise((n,r)=>{const s=()=>{t.removeEventListener("success",a),t.removeEventListener("error",i)},a=()=>{n(y(t.result)),s()},i=()=>{r(t.error),s()};t.addEventListener("success",a),t.addEventListener("error",i)});return e.then(n=>{n instanceof IDBCursor&&be.set(n,t)}).catch(()=>{}),G.set(e,t),e}function gt(t){if(U.has(t))return;const e=new Promise((n,r)=>{const s=()=>{t.removeEventListener("complete",a),t.removeEventListener("error",i),t.removeEventListener("abort",i)},a=()=>{n(),s()},i=()=>{r(t.error||new DOMException("AbortError","AbortError")),s()};t.addEventListener("complete",a),t.addEventListener("error",i),t.addEventListener("abort",i)});U.set(t,e)}let j={get(t,e,n){if(t instanceof IDBTransaction){if(e==="done")return U.get(t);if(e==="objectStoreNames")return t.objectStoreNames||ye.get(t);if(e==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return y(t[e])},set(t,e,n){return t[e]=n,!0},has(t,e){return t instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in t}};function bt(t){j=t(j)}function yt(t){return t===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...n){const r=t.call(H(this),e,...n);return ye.set(r,e.sort?e.sort():[e]),y(r)}:pt().includes(t)?function(...e){return t.apply(H(this),e),y(be.get(this))}:function(...e){return y(t.apply(H(this),e))}}function _t(t){return typeof t=="function"?yt(t):(t instanceof IDBTransaction&&gt(t),ht(t,ft())?new Proxy(t,j):t)}function y(t){if(t instanceof IDBRequest)return mt(t);if($.has(t))return $.get(t);const e=_t(t);return e!==t&&($.set(t,e),G.set(e,t)),e}const H=t=>G.get(t);function wt(t,e,{blocked:n,upgrade:r,blocking:s,terminated:a}={}){const i=indexedDB.open(t,e),c=y(i);return r&&i.addEventListener("upgradeneeded",u=>{r(y(i.result),u.oldVersion,u.newVersion,y(i.transaction),u)}),n&&i.addEventListener("blocked",u=>n(u.oldVersion,u.newVersion,u)),c.then(u=>{a&&u.addEventListener("close",()=>a()),s&&u.addEventListener("versionchange",d=>s(d.oldVersion,d.newVersion,d))}).catch(()=>{}),c}const Et=["get","getKey","getAll","getAllKeys","count"],vt=["put","add","delete","clear"],L=new Map;function ee(t,e){if(!(t instanceof IDBDatabase&&!(e in t)&&typeof e=="string"))return;if(L.get(e))return L.get(e);const n=e.replace(/FromIndex$/,""),r=e!==n,s=vt.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(s||Et.includes(n)))return;const a=async function(i,...c){const u=this.transaction(i,s?"readwrite":"readonly");let d=u.store;return r&&(d=d.index(c.shift())),(await Promise.all([d[n](...c),s&&u.done]))[0]};return L.set(e,a),a}bt(t=>({...t,get:(e,n,r)=>ee(e,n)||t.get(e,n,r),has:(e,n)=>!!ee(e,n)||t.has(e,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(It(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function It(t){const e=t.getComponent();return(e==null?void 0:e.type)==="VERSION"}const V="@firebase/app",te="0.14.7";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const m=new lt("@firebase/app"),St="@firebase/app-compat",Dt="@firebase/analytics-compat",At="@firebase/analytics",Bt="@firebase/app-check-compat",Tt="@firebase/app-check",Ot="@firebase/auth",Rt="@firebase/auth-compat",Mt="@firebase/database",Nt="@firebase/data-connect",xt="@firebase/database-compat",Pt="@firebase/functions",$t="@firebase/functions-compat",Ht="@firebase/installations",Lt="@firebase/installations-compat",kt="@firebase/messaging",Ft="@firebase/messaging-compat",Ut="@firebase/performance",jt="@firebase/performance-compat",Vt="@firebase/remote-config",zt="@firebase/remote-config-compat",Wt="@firebase/storage",Gt="@firebase/storage-compat",Jt="@firebase/firestore",qt="@firebase/ai",Kt="@firebase/firestore-compat",Zt="firebase",Yt="12.8.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O="[DEFAULT]",Xt={[V]:"fire-core",[St]:"fire-core-compat",[At]:"fire-analytics",[Dt]:"fire-analytics-compat",[Tt]:"fire-app-check",[Bt]:"fire-app-check-compat",[Ot]:"fire-auth",[Rt]:"fire-auth-compat",[Mt]:"fire-rtdb",[Nt]:"fire-data-connect",[xt]:"fire-rtdb-compat",[Pt]:"fire-fn",[$t]:"fire-fn-compat",[Ht]:"fire-iid",[Lt]:"fire-iid-compat",[kt]:"fire-fcm",[Ft]:"fire-fcm-compat",[Ut]:"fire-perf",[jt]:"fire-perf-compat",[Vt]:"fire-rc",[zt]:"fire-rc-compat",[Wt]:"fire-gcs",[Gt]:"fire-gcs-compat",[Jt]:"fire-fst",[Kt]:"fire-fst-compat",[qt]:"fire-vertex","fire-js":"fire-js",[Zt]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const R=new Map,Qt=new Map,z=new Map;function ne(t,e){try{t.container.addComponent(e)}catch(n){m.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`,n)}}function W(t){const e=t.name;if(z.has(e))return m.debug(`There were multiple attempts to register component ${e}.`),!1;z.set(e,t);for(const n of R.values())ne(n,t);for(const n of Qt.values())ne(n,t);return!0}function en(t,e){const n=t.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),t.container.getProvider(e)}function Kn(t,e,n=O){en(t,e).clearInstance(n)}function Zn(t){return t==null?!1:t.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tn={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},_=new ge("app","Firebase",tn);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nn{constructor(e,n,r){this._isDeleted=!1,this._options={...e},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new T("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw _.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yn=Yt;function _e(t,e={}){let n=t;typeof e!="object"&&(e={name:e});const r={name:O,automaticDataCollectionEnabled:!0,...e},s=r.name;if(typeof s!="string"||!s)throw _.create("bad-app-name",{appName:String(s)});if(n||(n=fe()),!n)throw _.create("no-options");const a=R.get(s);if(a){if(F(n,a.options)&&F(r,a.config))return a;throw _.create("duplicate-app",{appName:s})}const i=new it(s);for(const u of z.values())i.addComponent(u);const c=new nn(n,r,i);return R.set(s,c),c}function Xn(t=O){const e=R.get(t);if(!e&&t===O&&fe())return _e();if(!e)throw _.create("no-app",{appName:t});return e}function D(t,e,n){let r=Xt[t]??t;n&&(r+=`-${n}`);const s=r.match(/\s|\//),a=e.match(/\s|\//);if(s||a){const i=[`Unable to register library "${r}" with version "${e}":`];s&&i.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&a&&i.push("and"),a&&i.push(`version name "${e}" contains illegal characters (whitespace or "/")`),m.warn(i.join(" "));return}W(new T(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rn="firebase-heartbeat-database",sn=1,C="firebase-heartbeat-store";let k=null;function we(){return k||(k=wt(rn,sn,{upgrade:(t,e)=>{switch(e){case 0:try{t.createObjectStore(C)}catch(n){console.warn(n)}}}}).catch(t=>{throw _.create("idb-open",{originalErrorMessage:t.message})})),k}async function an(t){try{const n=(await we()).transaction(C),r=await n.objectStore(C).get(Ee(t));return await n.done,r}catch(e){if(e instanceof I)m.warn(e.message);else{const n=_.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});m.warn(n.message)}}}async function re(t,e){try{const r=(await we()).transaction(C,"readwrite");await r.objectStore(C).put(e,Ee(t)),await r.done}catch(n){if(n instanceof I)m.warn(n.message);else{const r=_.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});m.warn(r.message)}}}function Ee(t){return`${t.name}!${t.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const on=1024,cn=30;class un{constructor(e){this.container=e,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new ln(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,n;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),a=se();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===a||this._heartbeatsCache.heartbeats.some(i=>i.date===a))return;if(this._heartbeatsCache.heartbeats.push({date:a,agent:s}),this._heartbeatsCache.heartbeats.length>cn){const i=hn(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){m.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=se(),{heartbeatsToSend:r,unsentEntries:s}=dn(this._heartbeatsCache.heartbeats),a=B(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),a}catch(n){return m.warn(n),""}}}function se(){return new Date().toISOString().substring(0,10)}function dn(t,e=on){const n=[];let r=t.slice();for(const s of t){const a=n.find(i=>i.agent===s.agent);if(a){if(a.dates.push(s.date),ae(n)>e){a.dates.pop();break}}else if(n.push({agent:s.agent,dates:[s.date]}),ae(n)>e){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class ln{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Ze()?Ye().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await an(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return re(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return re(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function ae(t){return B(JSON.stringify({version:2,heartbeats:t})).length}function hn(t){if(t.length===0)return-1;let e=0,n=t[0].date;for(let r=1;r<t.length;r++)t[r].date<n&&(n=t[r].date,e=r);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fn(t){W(new T("platform-logger",e=>new Ct(e),"PRIVATE")),W(new T("heartbeat",e=>new un(e),"PRIVATE")),D(V,te,t),D(V,te,"esm2020"),D("fire-js","")}fn("");var pn="firebase",mn="12.8.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */D(pn,mn,"app");const ve=_e({apiKey:"AIzaSyDSHwlWQ06WDah-pmzBukRSJAqTm-AwyVk",authDomain:"amid-7592b.firebaseapp.com",projectId:"amid-7592b",storageBucket:"amid-7592b.firebasestorage.app",messagingSenderId:"301918770506",appId:"1:301918770506:web:ecc9d6ac102a030c6b1db3"});let ie=null;function gn(){return ie||(ie=ue(()=>import("./index.esm-B_ZjuLrV.js"),__vite__mapDeps([0,1,2,3])).then(t=>({m:t,auth:t.getAuth(ve)}))),ie}async function bn(){const{m:t,auth:e}=await gn();return await e.authStateReady(),e.currentUser||await t.signInAnonymously(e),e.currentUser}let oe=null;function yn(){return oe||(oe=ue(()=>import("./index.esm-6SeMM0ub.js"),__vite__mapDeps([4,1,2,3])).then(t=>({m:t,db:t.getFirestore(ve)}))),oe}const _n=18e4,wn="https://relay.alkebuleum.com",Ce=5000000000n,En=8e4,vn=8e6,w=new Ne(["function primary() view returns (address)","function signerNonce(address signer) view returns (uint256)","function getRelayedCallHash(address signer, address target, uint256 value, bytes data, uint256 nonce, uint256 deadline) view returns (bytes32)","function execute(address target, uint256 value, bytes data)"]),Ie=t=>`nuru://connect?c=${t}`,Se=t=>`nuru://sign?f=${t}`,Cn="https://play.google.com/store/apps/details?id=com.alkebuleum.nuru",De=()=>new Pe(xe,de,{staticNetwork:!0}),Ae=(t="")=>t+Date.now().toString(36)+Math.random().toString(36).slice(2,8),In=t=>new Promise(e=>setTimeout(e,t));class Be extends Error{constructor(e){super(e),this.rejected=!0}}async function Te(t,e,n,{accept:r,rejectMsg:s,timeoutMsg:a,onReady:i}){await bn();const{m:c,db:u}=await yn(),d=c.doc(u,t,e);return await c.setDoc(d,{status:"pending",...n,createdAt:c.serverTimestamp()}),i(),new Promise((g,f)=>{let o=()=>{};const h=setTimeout(()=>{o(),c.deleteDoc(d).catch(()=>{}),f(new Error(a))},_n);o=c.onSnapshot(d,p=>{const b=p.data();b&&(r(b)?(clearTimeout(h),o(),g(b)):b.status==="rejected"&&(clearTimeout(h),o(),c.deleteDoc(d).catch(()=>{}),f(new Be(b.error||s))))},p=>{clearTimeout(h),f(p)})})}async function Sn(t){const e=Ae("conn_"),n=await Te("connect_requests",e,{},{accept:r=>r.status==="connected"&&r.aaWallet&&r.signer,rejectMsg:"Connection rejected in Nuru.",timeoutMsg:"Nuru didn't respond in time. Make sure Nuru is open and try again.",onReady:()=>t(Ie(e))});return{type:"nuru",address:A(n.aaWallet),signer:A(n.signer),ain:n.ain?String(n.ain).toUpperCase():"",handle:n.primaryHandle||""}}async function M(t,e,n){const r=Ae();return(await Te("sign_requests",r,{method:t,params:e,chainId:de},{accept:a=>a.status==="signed"&&a.result,rejectMsg:"Request rejected in Nuru.",timeoutMsg:"Nuru didn't respond in time. Open Nuru and check for a pending approval.",onReady:()=>n(Se(r))})).result}async function Oe(t){const e=De();for(let n=0;n<80;n++){const r=await e.getTransactionReceipt(t).catch(()=>null);if(r){if(r.status!==1)throw new Error("Transaction reverted on chain.");return r}await In(1500)}throw new Error("Transaction not confirmed yet. Check Nuru for its status.")}async function ce(t,e){let n;try{n=await fetch(`${wn}${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})}catch{throw new Error("The Nuru relay didn't accept a request from this site, so payments from a linked Nuru key can't go through here yet. Switch Nuru to your primary key, or use the Nuru in-app browser, and try again.")}const r=await n.json().catch(()=>null);if(!n.ok||!(r!=null&&r.ok))throw new Error(`Relay ${t} failed: ${(r==null?void 0:r.error)||(r==null?void 0:r.rawError)||n.statusText}`);return r}async function Dn(t,{to:e,data:n="0x",value:r=0n,gas:s=6e5},a){const i=De(),c=BigInt(r);if(w.decodeFunctionResult("primary",await i.call({to:t.address,data:w.encodeFunctionData("primary")}))[0].toLowerCase()===t.signer.toLowerCase())return M("eth_sendTransaction",[{from:t.signer,to:t.address,data:w.encodeFunctionData("execute",[e,c,n]),value:"0x0",gasPrice:"0x"+Ce.toString(16),gas:"0x"+(Number(s)+En).toString(16)}],a);const d=Math.floor(Date.now()/1e3)+600,g=w.decodeFunctionResult("signerNonce",await i.call({to:t.address,data:w.encodeFunctionData("signerNonce",[t.signer])}))[0],f=w.decodeFunctionResult("getRelayedCallHash",await i.call({to:t.address,data:w.encodeFunctionData("getRelayedCallHash",[t.signer,e,c,n,g,BigInt(d)])}))[0],o=await M("eth_sign",[t.signer,f],a),h={wallet:t.address,signer:t.signer,target:e,data:n,value:c.toString(),deadline:d,signature:o,gasLimit:vn};return await ce("/relay/preview",h),(await ce("/relay",h)).txHash}async function An(t,{to:e,data:n="0x",value:r=0n,gas:s=60000n},a){const i=await M("eth_sendTransaction",[{from:t.signer,to:e,data:n,value:"0x"+BigInt(r).toString(16),gasPrice:"0x"+Ce.toString(16),gas:"0x"+BigInt(s).toString(16)}],a);return await Oe(i),i}const Re=()=>{var t;return typeof window<"u"&&((t=window.ethereum)!=null&&t._isNuruWallet)?window.ethereum:null};async function Bn(){const t=Re(),[e]=await t.request({method:"eth_requestAccounts"});let n=null;try{n=await t.request({method:"nuru_getIdentity"})}catch{}return{type:"nuru-browser",address:A((n==null?void 0:n.aaWallet)||e),signer:A(e),ain:n!=null&&n.ain?String(n.ain).toUpperCase():"",handle:(n==null?void 0:n.primaryHandle)||""}}const Qn=Object.freeze(Object.defineProperty({__proto__:null,NURU_PLAY_STORE:Cn,RejectedError:Be,nuruBrowserConnect:Bn,nuruConnect:Sn,nuruConnectUri:Ie,nuruInjected:Re,nuruSendFromSigner:An,nuruSendTransaction:Dn,nuruSign:M,nuruSignUri:Se,waitForReceipt:Oe},Symbol.toStringTag,{value:"Module"}));export{Jn as A,xn as B,T as C,Rn as D,ge as E,I as F,Kn as G,Ue as H,Ze as I,Un as J,jn as K,lt as L,Qn as M,Cn as N,Yn as S,Zn as _,Bn as a,Sn as b,zn as c,F as d,Gn as e,en as f,qn as g,Mn as h,Je as i,We as j,Xn as k,pe as l,Fn as m,Re as n,Vn as o,Nn as p,Wn as q,Fe as r,l as s,$n as t,Pn as u,kn as v,Ln as w,Hn as x,W as y,D as z};

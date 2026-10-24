/* LifePdf: browser-only tools. No analytics, accounts, history, or file upload endpoints. */
(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const toolGrid = $("#tool-grid");
  const workspace = $("#workspace");
  const workspaceBody = $("#workspace-body");
  const status = $("#tool-status");
  let activeCategory = "all";
  let activeTool = null;
  const tools = [
    {id:"image-pdf",name:"Images to PDF",desc:"Combine JPG and PNG images into one PDF.",cat:"pdf",icon:"▤",tag:"Working"},
    {id:"pdf-images",name:"PDF to images",desc:"Export PDF pages as PNG images in a ZIP.",cat:"pdf",icon:"▧",tag:"Working"},
    {id:"pdf-merge",name:"Merge PDF",desc:"Combine multiple PDFs into one file.",cat:"pdf",icon:"⊕",tag:"Working"},
    {id:"pdf-split",name:"Split PDF",desc:"Save selected page ranges as separate PDFs.",cat:"pdf",icon:"⇄",tag:"Working"},
    {id:"pdf-extract",name:"Extract PDF pages",desc:"Pick individual pages to create a new PDF.",cat:"pdf",icon:"↗",tag:"Working"},
    {id:"pdf-rotate",name:"Rotate PDF pages",desc:"Rotate all pages in a PDF by 90° steps.",cat:"pdf",icon:"⟳",tag:"Working"},
    {id:"pdf-info",name:"PDF page info",desc:"Inspect page count and dimensions locally.",cat:"pdf",icon:"ⓘ",tag:"Working"},
    {id:"image-resize",name:"Image resizer",desc:"Resize images by pixels or percentage.",cat:"image",icon:"↗",tag:"Working"},
    {id:"image-compress",name:"Image compressor",desc:"Reduce JPG, PNG or WebP output quality/size.",cat:"image",icon:"⌁",tag:"Working"},
    {id:"image-convert",name:"Image format converter",desc:"Convert images to PNG, JPEG or WebP.",cat:"image",icon:"◈",tag:"Working"},
    {id:"image-crop",name:"Image crop",desc:"Crop an image using pixel coordinates.",cat:"image",icon:"▣",tag:"Working"},
    {id:"image-dimensions",name:"Image dimensions",desc:"Read pixel dimensions and file size.",cat:"image",icon:"↔",tag:"Working"},
    {id:"bulk-images",name:"Bulk image convert",desc:"Convert multiple images and download as ZIP.",cat:"image",icon:"▦",tag:"Working"},
    {id:"word-counter",name:"Word counter",desc:"Count words, characters, sentences and lines.",cat:"text",icon:"¶",tag:"Working"},
    {id:"case-converter",name:"Case converter",desc:"Convert text to upper, lower, title or sentence case.",cat:"text",icon:"Aa",tag:"Working"},
    {id:"json-formatter",name:"JSON formatter",desc:"Format or minify JSON and report syntax errors.",cat:"text",icon:"{}",tag:"Working"},
    {id:"base64",name:"Base64 encoder",desc:"Encode/decode text locally (not encryption).",cat:"text",icon:"⇄",tag:"Working"},
    {id:"file-hash",name:"File hash checker",desc:"Calculate SHA-256 hash of a selected file.",cat:"text",icon:"#",tag:"Working"},
    {id:"qr",name:"QR code generator",desc:"Create a QR code from text or a URL.",cat:"daily",icon:"▦",tag:"Working"},
    {id:"password",name:"Password generator",desc:"Generate random passwords using browser crypto.",cat:"daily",icon:"⌑",tag:"Working"},
    {id:"percentage",name:"Percentage calculator",desc:"Calculate a percentage of a value.",cat:"daily",icon:"%",tag:"Working"},
    {id:"unit-converter",name:"Length converter",desc:"Convert common metric and imperial lengths.",cat:"daily",icon:"↔",tag:"Working"},
    {id:"color",name:"Color converter",desc:"Inspect HEX, RGB and HSL color values.",cat:"daily",icon:"◉",tag:"Working"},
    {id:"lorem",name:"Lorem ipsum generator",desc:"Generate placeholder text for mockups.",cat:"daily",icon:"¶",tag:"Working"}
  ];

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function renderTools() {
    const query = $("#tool-search").value.trim().toLowerCase();
    const visible = tools.filter(t => (activeCategory==="all" || t.cat===activeCategory) && (t.name+" "+t.desc+" "+t.cat).toLowerCase().includes(query));
    toolGrid.innerHTML = visible.map(t => `<button class="tool-card" data-tool="${t.id}"><span class="arrow">↗</span><span class="tool-icon">${t.icon}</span><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p><span class="tool-badge">${t.tag}</span></button>`).join("");
    $("#no-results").hidden = visible.length !== 0;
  }
  function setStatus(message, kind="") { status.textContent=message; status.className="tool-status"+(kind?" "+kind:""); }
  function showTool(id) {
    const t = tools.find(x=>x.id===id); if(!t) return;
    activeTool=t; workspace.hidden=false; $("#workspace-title").textContent=t.name; $("#workspace-description").textContent=t.desc;
    workspaceBody.innerHTML = toolMarkup(id); setStatus(""); workspace.scrollIntoView({behavior:"smooth",block:"start"});
    const form=$("#tool-form"); if(form) form.addEventListener("submit", e=>{e.preventDefault(); runTool(id,new FormData(form));});
    const file=$("#file-input"); if(file && id==="image-dimensions") file.addEventListener("change",()=>inspectImage(file.files[0]));
  }
  const fileField=(label="Choose file",accept="*/*",multiple=false,help="Files are processed in this browser and are not uploaded.")=>`<div class="field"><label for="file-input">${label}</label><input id="file-input" name="files" type="file" accept="${accept}" ${multiple?"multiple":""} required><small>${help}</small></div>`;
  const numberField=(label,name,value,min=1,max=100000)=>`<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="number" min="${min}" max="${max}" value="${value}" required></div>`;
  const selectField=(label,name,options)=>`<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join("")}</select></div>`;
  const textField=(label,name,value="",placeholder="")=>`<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="text" value="${esc(value)}" placeholder="${esc(placeholder)}" required></div>`;
  const textarea=(label,name,placeholder="Paste or type here…",value="")=>`<div class="field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" rows="7" placeholder="${esc(placeholder)}">${esc(value)}</textarea></div>`;
  const button=(label="Process locally")=>`<button class="primary-btn" type="submit">✦ ${label}</button>`;
  function toolMarkup(id) {
    switch(id) {
      case "image-pdf": return `<form id="tool-form" class="tool-form">${fileField("Choose images","image/jpeg,image/png,image/webp",true)}<div class="form-row">${selectField("Page size","pageSize",[["a4","A4"],["letter","US Letter"],["image","Fit page to image"]])}${selectField("Image fit","fit",[["contain","Fit inside page"],["cover","Fill page (may crop)"]])}</div>${button("Create PDF")}</form>`;
      case "pdf-merge": return `<form id="tool-form" class="tool-form">${fileField("Choose two or more PDFs","application/pdf",true)}<small class="help-text">Files are merged in the order selected by your file picker.</small>${button("Merge PDFs")}</form>`;
      case "pdf-split": return `<form id="tool-form" class="tool-form">${fileField("Choose a PDF","application/pdf")}<div class="form-row">${numberField("First page","startPage",1)}${numberField("Last page","endPage",1)}</div><small class="help-text">Page numbers start at 1. The selected range is saved as a separate PDF.</small>${button("Split selected pages")}</form>`;
      case "pdf-extract": return `<form id="tool-form" class="tool-form">${fileField("Choose a PDF","application/pdf")}${textField("Pages to extract","pages","1,3-5","Example: 1,3-5")}${button("Extract pages")}</form>`;
      case "pdf-rotate": return `<form id="tool-form" class="tool-form">${fileField("Choose a PDF","application/pdf")}${selectField("Rotation","degrees",[["90","90° clockwise"],["180","180°"],["270","270° clockwise"]])}${button("Rotate PDF")}</form>`;
      case "pdf-info": return `<form id="tool-form" class="tool-form">${fileField("Choose a PDF","application/pdf")}${button("Inspect PDF")}</form>`;
      case "pdf-images": return `<form id="tool-form" class="tool-form">${fileField("Choose a PDF","application/pdf")}<div class="form-row">${selectField("Output format","format",[["png","PNG"],["jpeg","JPEG"]])}${numberField("Render scale","scale",1.5,0.5,3)}</div><small class="help-text">Each page is rendered in-browser. Large PDFs may use significant memory.</small>${button("Render pages & ZIP")}</form>`;
      case "image-resize": return `<form id="tool-form" class="tool-form">${fileField("Choose an image","image/*")}<div class="form-row">${numberField("Width (px)","width",800,1,12000)}${numberField("Height (px)","height",600,1,12000)}</div><label><input type="checkbox" name="keepRatio" checked> Keep aspect ratio (fit within dimensions)</label>${selectField("Output format","format",[["image/jpeg","JPEG"],["image/png","PNG"],["image/webp","WebP"]])}${numberField("Quality (JPEG/WebP) %","quality",85,1,100)}${button("Resize image")}</form>`;
      case "image-compress": return `<form id="tool-form" class="tool-form">${fileField("Choose an image","image/*")}${selectField("Output format","format",[["image/webp","WebP (often smaller)"],["image/jpeg","JPEG"],["image/png","PNG (lossless; may not shrink)"]])}${numberField("Quality (JPEG/WebP) %","quality",75,1,100)}${button("Compress image")}</form>`;
      case "image-convert": return `<form id="tool-form" class="tool-form">${fileField("Choose an image","image/*")}${selectField("Convert to","format",[["image/png","PNG"],["image/jpeg","JPEG"],["image/webp","WebP"]])}${numberField("Quality (JPEG/WebP) %","quality",90,1,100)}${button("Convert image")}</form>`;
      case "image-crop": return `<form id="tool-form" class="tool-form">${fileField("Choose an image","image/*")}<div class="form-row">${numberField("X (px)","x",0,0,12000)}${numberField("Y (px)","y",0,0,12000)}</div><div class="form-row">${numberField("Crop width (px)","width",400,1,12000)}${numberField("Crop height (px)","height",400,1,12000)}</div>${selectField("Output format","format",[["image/png","PNG"],["image/jpeg","JPEG"],["image/webp","WebP"]])}${button("Crop image")}</form>`;
      case "image-dimensions": return `<form id="tool-form" class="tool-form">${fileField("Choose an image","image/*")}</form><div id="image-inspection" class="tool-status"></div>`;
      case "bulk-images": return `<form id="tool-form" class="tool-form">${fileField("Choose multiple images","image/*",true)}${selectField("Output format","format",[["image/webp","WebP"],["image/jpeg","JPEG"],["image/png","PNG"]])}${numberField("Quality %","quality",85,1,100)}${button("Convert & download ZIP")}</form>`;
      case "word-counter": return `<form id="tool-form" class="tool-form">${textarea("Your text","text","Paste your text here…")}${button("Count text")}</form>`;
      case "case-converter": return `<form id="tool-form" class="tool-form">${textarea("Your text","text","Type or paste text here…")}${selectField("Case","case",[["upper","UPPERCASE"],["lower","lowercase"],["title","Title Case"],["sentence","Sentence case"]])}${button("Convert text")}</form>`;
      case "json-formatter": return `<form id="tool-form" class="tool-form">${textarea("JSON input","text",'{"hello":"world"}')}${selectField("Action","action",[["pretty","Format / beautify"],["minify","Minify"]])}${button("Process JSON")}</form>`;
      case "base64": return `<form id="tool-form" class="tool-form">${textarea("Input text","text","Enter plain text or Base64…")}${selectField("Action","action",[["encode","Encode text to Base64"],["decode","Decode Base64 to text"]])}<small class="help-text">Base64 is an encoding format, not encryption or a secure way to hide secrets.</small>${button("Convert")}</form>`;
      case "file-hash": return `<form id="tool-form" class="tool-form">${fileField("Choose any file","*/*")}${button("Calculate SHA-256")}</form>`;
      case "qr": return `<form id="tool-form" class="tool-form">${textarea("Text or URL","text","https://example.com")}${button("Generate QR code")}</form><div id="qr-output"></div>`;
      case "password": return `<form id="tool-form" class="tool-form">${numberField("Password length","length",20,8,128)}<div class="field"><label><input type="checkbox" name="upper" checked> Uppercase letters</label><label><input type="checkbox" name="lower" checked> Lowercase letters</label><label><input type="checkbox" name="numbers" checked> Numbers</label><label><input type="checkbox" name="symbols" checked> Symbols</label></div>${button("Generate password")}</form>`;
      case "percentage": return `<form id="tool-form" class="tool-form">${numberField("What is this percentage?","percent",15,-100000000,100000000)}${numberField("Of value","value",200,-100000000,100000000)}${button("Calculate")}</form>`;
      case "unit-converter": return `<form id="tool-form" class="tool-form">${numberField("Value","value",1,-1e12,1e12)}<div class="form-row">${selectField("From","from",[["mm","Millimeters"],["cm","Centimeters"],["m","Meters"],["km","Kilometers"],["in","Inches"],["ft","Feet"],["mi","Miles"]])}${selectField("To","to",[["cm","Centimeters"],["mm","Millimeters"],["m","Meters"],["km","Kilometers"],["in","Inches"],["ft","Feet"],["mi","Miles"]])}</div>${button("Convert units")}</form>`;
      case "color": return `<form id="tool-form" class="tool-form">${textField("HEX color","hex","#6C63FF","#RRGGBB")}${button("Convert color")}</form><div id="color-output"></div>`;
      case "lorem": return `<form id="tool-form" class="tool-form">${numberField("Number of paragraphs","count",3,1,30)}${button("Generate text")}</form>`;
      default: return `<p>This tool is not included in this release.</p>`;
    }
  }
  function downloadBlob(blob, filename) {
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function outputLink(blob,name,label="Download") {
    const url=URL.createObjectURL(blob);
    const wrap=document.createElement("div"); wrap.className="result-item";
    const info=document.createElement("span"); info.textContent=name;
    const a=document.createElement("a"); a.href=url; a.download=name; a.textContent=label;
    wrap.append(info,a); $("#workspace-body").append(wrap);
  }
  function safeName(file, ext) { return (file.name.replace(/\.[^.]+$/,"").replace(/[^\w-]+/g,"-")||"lifepdf-output")+"."+ext; }
  function readFile(file) { return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("Could not read the selected file."));r.readAsArrayBuffer(file);}); }
  async function getPdfLib() { if(!window.PDFLib) throw new Error("PDF library did not load. Check your internet connection or CDN access."); return window.PDFLib; }
  function parsePages(str,total) {
    const set=new Set();
    for(const part of str.split(",")){const p=part.trim();if(!p)continue;const m=p.match(/^(\d+)\s*-\s*(\d+)$/);if(m){let a=+m[1],b=+m[2];if(a>b)[a,b]=[b,a];for(let n=a;n<=b;n++){if(n<1||n>total)throw new Error(`Page ${n} is outside this PDF (1–${total}).`);set.add(n-1);}}else if(/^\d+$/.test(p)){const n=+p;if(n<1||n>total)throw new Error(`Page ${n} is outside this PDF (1–${total}).`);set.add(n-1);}else throw new Error(`Invalid page range: ${p}`);}
    if(!set.size)throw new Error("Enter at least one page number."); return [...set].sort((a,b)=>a-b);
  }
  async function imageFromFile(file) { const url=URL.createObjectURL(file); try { const img=new Image(); img.decoding="async"; img.src=url; await img.decode(); return img; } finally { /* URL kept until decode resolves */ } }
  async function canvasBlob(canvas,type,quality) { return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("This image format could not be created by your browser.")),type,quality)); }
  async function processImage(file, opts={}) {
    const url=URL.createObjectURL(file);
    try {
      const img=new Image(); img.src=url; await img.decode();
      let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
      if(opts.crop){sx=opts.x;sy=opts.y;sw=opts.width;sh=opts.height;if(sx+sw>img.naturalWidth||sy+sh>img.naturalHeight)throw new Error(`Crop exceeds source dimensions (${img.naturalWidth} × ${img.naturalHeight}).`);}
      let width=opts.width||sw,height=opts.height||sh;
      if(opts.keepRatio){const ratio=Math.min(width/sw,height/sh);width=Math.max(1,Math.round(sw*ratio));height=Math.max(1,Math.round(sh*ratio));}
      const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas is unavailable.");
      if(opts.type==="image/jpeg") {ctx.fillStyle="#fff";ctx.fillRect(0,0,width,height);}
      ctx.drawImage(img,sx,sy,sw,sh,0,0,width,height);
      const blob=await canvasBlob(canvas,opts.type||"image/png",opts.quality??.9);
      return {blob,width,height};
    } finally { URL.revokeObjectURL(url); }
  }
  async function runTool(id, fd) {
    setStatus("Working locally…");
    const files=[...(fd.getAll("files")||[])].filter(f=>f instanceof File && f.size>0);
    try {
      switch(id) {
        case "image-pdf": {
          if(!files.length)throw new Error("Choose at least one image.");
          const {PDFDocument, PageSizes}=await getPdfLib();const pdf=await PDFDocument.create();
          const size=fd.get("pageSize"),fit=fd.get("fit");
          for(const file of files){let bytes=await readFile(file), embedded;
            if(file.type==="image/jpeg")embedded=await pdf.embedJpg(bytes);
            else if(file.type==="image/png")embedded=await pdf.embedPng(bytes);
            else {const converted=await processImage(file,{type:"image/png"});embedded=await pdf.embedPng(await converted.blob.arrayBuffer());}
            let pageW,pageH;if(size==="a4"){[pageW,pageH]=PageSizes.A4;}else if(size==="letter"){[pageW,pageH]=PageSizes.Letter;}else{pageW=embedded.width;pageH=embedded.height;}
            const page=pdf.addPage([pageW,pageH]);const scale=fit==="cover"?Math.max(pageW/embedded.width,pageH/embedded.height):Math.min(pageW/embedded.width,pageH/embedded.height);
            const w=embedded.width*scale,h=embedded.height*scale;page.drawImage(embedded,{x:(pageW-w)/2,y:(pageH-h)/2,width:w,height:h});
          }
          const out=await pdf.save();outputLink(new Blob([out],{type:"application/pdf"}),"images.pdf");setStatus(`Created PDF with ${files.length} page(s).`,"success");break;
        }
        case "pdf-merge": {
          if(files.length<2)throw new Error("Choose at least two PDF files.");
          const {PDFDocument}=await getPdfLib();const merged=await PDFDocument.create();
          for(const f of files){const doc=await PDFDocument.load(await readFile(f));const pages=await merged.copyPages(doc,doc.getPageIndices());pages.forEach(p=>merged.addPage(p));}
          outputLink(new Blob([await merged.save()],{type:"application/pdf"}),"merged.pdf");setStatus(`Merged ${files.length} PDFs successfully.`,"success");break;
        }
        case "pdf-split": case "pdf-extract": case "pdf-rotate": case "pdf-info": {
          const file=files[0];if(!file)throw new Error("Choose a PDF file.");
          const {PDFDocument}=await getPdfLib();const doc=await PDFDocument.load(await readFile(file));const total=doc.getPageCount();
          if(id==="pdf-info"){const pages=doc.getPages();const dims=pages.map((p,i)=>`Page ${i+1}: ${Math.round(p.getWidth())} × ${Math.round(p.getHeight())} pt`).join("\n");setStatus(`Pages: ${total}\nFile size: ${(file.size/1024).toFixed(1)} KB\n\n${dims}`,"success");break;}
          if(id==="pdf-rotate"){const deg=+fd.get("degrees");doc.getPages().forEach(p=>p.setRotation(PDFLib.degrees((p.getRotation().angle+deg)%360)));outputLink(new Blob([await doc.save()],{type:"application/pdf"}),safeName(file,"rotated.pdf").replace(/\.rotated\.pdf$/,"-rotated.pdf"));setStatus("PDF page rotations updated.","success");break;}
          let indices;
          if(id==="pdf-split"){let a=+fd.get("startPage"),b=+fd.get("endPage");if(a>b)[a,b]=[b,a];if(a<1||b>total)throw new Error(`Page range must be between 1 and ${total}.`);indices=Array.from({length:b-a+1},(_,i)=>a+i-1);}
          else indices=parsePages(fd.get("pages"),total);
          const out=await PDFDocument.create();const pages=await out.copyPages(doc,indices);pages.forEach(p=>out.addPage(p));outputLink(new Blob([await out.save()],{type:"application/pdf"}),id==="pdf-split"?"split-pages.pdf":"extracted-pages.pdf");setStatus(`Saved ${indices.length} page(s) to a new PDF.`,"success");break;
        }
        case "pdf-images": {
          const file=files[0];if(!file)throw new Error("Choose a PDF file.");
          if(!window.pdfjsLib)throw new Error("PDF renderer did not load. Check CDN access.");
          pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const bytes=await readFile(file);const pdf=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;const zip=new JSZip();const format=fd.get("format"),scale=+fd.get("scale");
          for(let i=1;i<=pdf.numPages;i++){setStatus(`Rendering page ${i} of ${pdf.numPages}…`);const page=await pdf.getPage(i);const viewport=page.getViewport({scale});const canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;const blob=await canvasBlob(canvas,format==="jpeg"?"image/jpeg":"image/png",.92);zip.file(`page-${String(i).padStart(3,"0")}.${format}`,blob);canvas.width=canvas.height=1;}
          const zipBlob=await zip.generateAsync({type:"blob"});outputLink(zipBlob,"pdf-pages.zip");setStatus(`Rendered ${pdf.numPages} page(s) and packed them into a ZIP.`,"success");break;
        }
        case "image-resize": case "image-compress": case "image-convert": case "image-crop": {
          const file=files[0];if(!file)throw new Error("Choose an image.");
          const type=fd.get("format")||"image/png",quality=(+fd.get("quality")||85)/100;
          const opts={type,quality};
          if(id==="image-resize"){opts.width=+fd.get("width");opts.height=+fd.get("height");opts.keepRatio=fd.get("keepRatio")==="on";}
          if(id==="image-crop"){opts.crop=true;opts.x=+fd.get("x");opts.y=+fd.get("y");opts.width=+fd.get("width");opts.height=+fd.get("height");}
          const result=await processImage(file,opts);const ext=type.split("/")[1].replace("jpeg","jpg");outputLink(result.blob,safeName(file,ext));setStatus(`Done: ${result.width} × ${result.height} px. Output ${(result.blob.size/1024).toFixed(1)} KB (source ${(file.size/1024).toFixed(1)} KB).`,"success");break;
        }
        case "image-dimensions": {inspectImage(files[0]);break;}
        case "bulk-images": {
          if(!files.length)throw new Error("Choose at least one image.");if(!window.JSZip)throw new Error("ZIP library did not load.");
          const zip=new JSZip(),type=fd.get("format"),quality=(+fd.get("quality")||85)/100;
          for(let i=0;i<files.length;i++){setStatus(`Converting ${i+1} of ${files.length}…`);const f=files[i];const r=await processImage(f,{type,quality});zip.file(safeName(f,type.split("/")[1].replace("jpeg","jpg")),r.blob);}
          outputLink(await zip.generateAsync({type:"blob"}),"converted-images.zip");setStatus(`Converted ${files.length} image(s).`,"success");break;
        }
        case "word-counter": {
          const text=fd.get("text")||"";const words=text.trim()?text.trim().split(/\s+/u).length:0;const chars=[...text].length;const noSpaces=[...text.replace(/\s/g,"")].length;const sentences=(text.match(/[.!?]+(?=\s|$)/g)||[]).length;const lines=text?text.split(/\r\n|\r|\n/).length:0;
          setStatus(`Words: ${words}\nCharacters: ${chars}\nCharacters without spaces: ${noSpaces}\nSentences (approx.): ${sentences}\nLines: ${lines}`,"success");break;
        }
        case "case-converter": {
          const text=fd.get("text")||"",mode=fd.get("case");let out=text;
          if(mode==="upper")out=text.toLocaleUpperCase();if(mode==="lower")out=text.toLocaleLowerCase();
          if(mode==="title")out=text.toLocaleLowerCase().replace(/(^|[\s\-'])\p{L}/gu,m=>m.toLocaleUpperCase());
          if(mode==="sentence")out=text.toLocaleLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu,m=>m.toLocaleUpperCase());
          showTextResult(out,"converted-text.txt");setStatus("Text converted. Use Copy or download the result.","success");break;
        }
        case "json-formatter": {
          const raw=fd.get("text")||"";let obj;try{obj=JSON.parse(raw);}catch(e){throw new Error("Invalid JSON: "+e.message);}
          showTextResult(fd.get("action")==="minify"?JSON.stringify(obj):JSON.stringify(obj,null,2),"formatted.json");setStatus("Valid JSON processed successfully.","success");break;
        }
        case "base64": {
          const raw=fd.get("text")||"";let out;
          if(fd.get("action")==="encode")out=btoa(String.fromCharCode(...new TextEncoder().encode(raw)));
          else {try{const binary=atob(raw.trim());out=new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));}catch(e){throw new Error("Could not decode Base64 as valid UTF-8 text.");}}
          showTextResult(out,"base64-result.txt");setStatus("Conversion complete. Base64 is not encryption.","success");break;
        }
        case "file-hash": {
          const file=files[0];if(!file)throw new Error("Choose a file.");const hash=await crypto.subtle.digest("SHA-256",await readFile(file));const hex=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");showTextResult(hex,"sha256.txt");setStatus("SHA-256 calculated locally.","success");break;
        }
        case "qr": {
          const text=fd.get("text")||"";if(!text.trim())throw new Error("Enter text or a URL.");if(!window.QRCode)throw new Error("QR library did not load. Check CDN access.");
          const box=$("#qr-output");box.innerHTML="";const holder=document.createElement("div");holder.style.cssText="background:white;padding:14px;display:inline-block;border-radius:12px;margin-top:15px";box.append(holder);
          new QRCode(holder,{text,width:240,height:240,colorDark:"#111827",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});setStatus("QR code generated locally in your browser.","success");
          const wait=()=>{const img=holder.querySelector("img"),canvas=holder.querySelector("canvas");if(canvas){canvas.toBlob(b=>{if(b)outputLink(b,"lifepdf-qr.png");});}else if(img){fetch(img.src).then(r=>r.blob()).then(b=>outputLink(b,"lifepdf-qr.png")).catch(()=>{});}};setTimeout(wait,100);break;
        }
        case "password": {
          const len=+fd.get("length");let chars="";if(fd.get("upper")==="on")chars+="ABCDEFGHJKLMNPQRSTUVWXYZ";if(fd.get("lower")==="on")chars+="abcdefghijkmnopqrstuvwxyz";if(fd.get("numbers")==="on")chars+="23456789";if(fd.get("symbols")==="on")chars+="!@#$%^&*()-_=+[]{}?";
          if(!chars)throw new Error("Select at least one character set.");const bytes=new Uint32Array(len);crypto.getRandomValues(bytes);let out="";for(let i=0;i<len;i++)out+=chars[bytes[i]%chars.length];showTextResult(out,"generated-password.txt");setStatus("Password generated using the browser's cryptographic random generator. Copy it somewhere safe; LifePdf does not save it.","success");break;
        }
        case "percentage": {const p=+fd.get("percent"),v=+fd.get("value");setStatus(`${p}% of ${v} = ${(p/100*v).toLocaleString(undefined,{maximumFractionDigits:8})}`,"success");break;}
        case "unit-converter": {
          const factors={mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,mi:1609.344};const val=+fd.get("value")*factors[fd.get("from")]/factors[fd.get("to")];setStatus(`${fd.get("value")} ${fd.get("from")} = ${Number(val.toPrecision(12)).toLocaleString()} ${fd.get("to")}`,"success");break;
        }
        case "color": {
          const hex=fd.get("hex").trim().replace(/^#/,"");if(!/^[0-9a-fA-F]{6}$/.test(hex))throw new Error("Enter a 6-digit HEX color such as #6C63FF.");
          const h=hex.toUpperCase(),r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);const [hh,ss,ll]=rgbToHsl(r,g,b);
          $("#color-output").innerHTML=`<div style="display:flex;align-items:center;gap:12px;margin-top:14px"><div style="width:54px;height:54px;border-radius:12px;background:#${h};border:1px solid var(--line)"></div><div><b>#${h}</b><br><small>RGB(${r}, ${g}, ${b}) · HSL(${hh}, ${ss}%, ${ll}%)</small></div></div>`;setStatus("Color values converted.","success");break;
        }
        case "lorem": {
          const count=+fd.get("count"),sample="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec sed odio dui. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.";const out=Array.from({length:count},()=>sample).join("\n\n");showTextResult(out,"lorem-ipsum.txt");setStatus(`${count} placeholder paragraph(s) generated.`,"success");break;
        }
      }
    } catch(e) { setStatus(e?.message||"Something went wrong. Please try another file or smaller input.","error"); }
  }
  function showTextResult(text,filename) {
    const box=document.createElement("div");box.className="field";box.style.marginTop="14px";
    const label=document.createElement("label");label.textContent="Result";
    const area=document.createElement("textarea");area.rows=Math.min(12,Math.max(3,text.split("\n").length));area.readOnly=true;area.value=text;
    const actions=document.createElement("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px";
    const copy=document.createElement("button");copy.type="button";copy.className="secondary-btn";copy.textContent="Copy result";copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(text);setStatus("Copied to clipboard.","success");}catch{area.select();document.execCommand("copy");setStatus("Copy attempted. If blocked, select the text and copy manually.");}});
    const dl=document.createElement("button");dl.type="button";dl.className="primary-btn";dl.textContent="Download result";dl.addEventListener("click",()=>downloadBlob(new Blob([text],{type:"text/plain;charset=utf-8"}),filename));
    actions.append(copy,dl);box.append(label,area,actions);workspaceBody.append(box);
  }
  async function inspectImage(file) {
    const target=$("#image-inspection");if(!file){if(target)target.textContent="Choose an image to inspect.";return;}
    try{const url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();target.textContent=`Dimensions: ${img.naturalWidth} × ${img.naturalHeight} px · File size: ${(file.size/1024).toFixed(1)} KB · Type: ${file.type||"unknown"}`;URL.revokeObjectURL(url);setStatus("Image details read locally.","success");}catch(e){setStatus("Could not read this image.","error");}
  }
  function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;if(max===min)h=s=0;else{const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];}
  toolGrid.addEventListener("click",e=>{const card=e.target.closest("[data-tool]");if(card)showTool(card.dataset.tool);});
  $("#tool-search").addEventListener("input",renderTools);
  $("#category-pills").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;$$(".category-pill").forEach(x=>x.classList.toggle("active",x===b));renderTools();});
  $("#close-workspace").addEventListener("click",()=>{workspace.hidden=true;workspaceBody.innerHTML="";activeTool=null;});
  $("#theme-toggle").addEventListener("click",()=>{const root=document.documentElement;const next=root.dataset.theme==="light"?"dark":"light";root.dataset.theme=next;$("#theme-toggle").textContent=next==="light"?"☾":"☼";$("#theme-toggle").setAttribute("aria-label",`Switch to ${next==="light"?"dark":"light"} theme`);});
  document.addEventListener("keydown",e=>{if(e.key==="/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();$("#tool-search").focus();}if(e.key==="Escape"&&!workspace.hidden){workspace.hidden=true;}});
  $("#year").textContent=new Date().getFullYear();
  renderTools();
})();
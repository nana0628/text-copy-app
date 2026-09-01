const KEY="text-copy-items";let items=load();let draggedId=null;
const editor=document.getElementById("editor"),textInput=document.getElementById("textInput"),memoInput=document.getElementById("memoInput"),starInput=document.getElementById("starInput"),list=document.getElementById("list"),favoritesList=document.getElementById("favoritesList"),empty=document.getElementById("empty"),favoriteEmpty=document.getElementById("favoriteEmpty"),count=document.getElementById("count"),favoriteCount=document.getElementById("favoriteCount"),toast=document.getElementById("toast");
document.getElementById("addBtn").onclick=()=>{editor.classList.remove("hidden");textInput.focus()};
document.getElementById("cancelBtn").onclick=closeEditor;
document.getElementById("saveBtn").onclick=()=>{const text=textInput.value.trim();if(!text){textInput.focus();return}items.push({id:id(),text,memo:memoInput.value.trim(),starred:starInput.checked});save();render();closeEditor()};
document.getElementById("clearBtn").onclick=()=>{if(items.length&&confirm("保存したテキストをすべて削除しますか？")){items=[];save();render()}};
document.getElementById("csvInput").onchange=handleCSV;
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())}
function load(){try{return(JSON.parse(localStorage.getItem(KEY))||[]).map(x=>({id:x.id||id(),text:x.text||"",memo:x.memo||"",starred:!!x.starred}))}catch{return[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(items))}
function closeEditor(){editor.classList.add("hidden");textInput.value="";memoInput.value="";starInput.checked=false}
function render(){list.innerHTML="";favoritesList.innerHTML="";items.forEach(x=>list.appendChild(makeItem(x,true)));items.filter(x=>x.starred).forEach(x=>favoritesList.appendChild(makeItem(x,false)));count.textContent=items.length+"件";favoriteCount.textContent=items.filter(x=>x.starred).length+"件";empty.style.display=items.length?"none":"block";favoriteEmpty.style.display=items.some(x=>x.starred)?"none":"block"}
function makeItem(item,drag){
 const row=document.createElement("div");row.className="item";row.dataset.id=item.id;row.draggable=drag;
 const handle=document.createElement("div");handle.className="drag-handle";handle.textContent="☷";handle.title=drag?"ドラッグして並べ替え":"一覧から並べ替え";
 const content=document.createElement("div");content.className="item-content";
 const text=document.createElement("div");text.className="item-text";text.textContent=item.text;content.appendChild(text);
 if(item.memo){const memo=document.createElement("div");memo.className="memo";memo.textContent="メモ："+item.memo;content.appendChild(memo)}
 const actions=document.createElement("div");actions.className="item-actions";
 const star=document.createElement("button");star.className="star-toggle"+(item.starred?" active":"");star.textContent="★";star.title=item.starred?"お気に入りから外す":"お気に入りに追加";star.onclick=()=>{item.starred=!item.starred;save();render()};
 const copy=document.createElement("button");copy.className="copy-btn";copy.textContent="コピー";copy.onclick=()=>copyText(item.text);actions.append(star,copy);row.append(handle,content,actions);
 if(drag){row.ondragstart=()=>{draggedId=item.id;row.classList.add("dragging")};row.ondragend=()=>{draggedId=null;row.classList.remove("dragging");document.querySelectorAll(".drag-over").forEach(x=>x.classList.remove("drag-over"))};row.ondragover=e=>{e.preventDefault();if(draggedId!==item.id)row.classList.add("drag-over")};row.ondragleave=()=>row.classList.remove("drag-over");row.ondrop=e=>{e.preventDefault();row.classList.remove("drag-over");if(!draggedId||draggedId===item.id)return;const from=items.findIndex(x=>x.id===draggedId),to=items.findIndex(x=>x.id===item.id),[m]=items.splice(from,1);items.splice(to,0,m);save();render()}}
 return row;
}
async function copyText(t){try{await navigator.clipboard.writeText(t)}catch{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove()}showToast("コピーしました")}
function showToast(t){toast.textContent=t;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1200)}
function handleCSV(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{const rows=parseCSV(r.result),imported=rows.filter(x=>x[0]?.trim()).map(x=>({id:id(),text:x[0].trim(),memo:x[1]?.trim()||"",starred:x[2]?["true","1","★","yes"].includes(x[2].trim().toLowerCase()):false}));if(!imported.length){alert("CSVから読み込めるテキストがありません。")}else{items.push(...imported);save();render();showToast(imported.length+"件読み込みました")}e.target.value=""};r.readAsText(file,"UTF-8")}
function parseCSV(csv){const rows=[];let row=[],f="",q=false;for(let i=0;i<csv.length;i++){const c=csv[i],n=csv[i+1];if(c=='"'){if(q&&n=='"'){f+='"';i++}else q=!q}else if(c==","&&!q){row.push(f);f=""}else if((c=="\n"||c=="\r")&&!q){if(c=="\r"&&n=="\n")i++;row.push(f);f="";if(row.some(v=>v!==""))rows.push(row);row=[]}else f+=c}if(f!==""||row.length){row.push(f);if(row.some(v=>v!==""))rows.push(row)}if(rows.length&&/^(text|テキスト|内容)$/i.test(rows[0][0].trim()))rows.shift();return rows}
render();

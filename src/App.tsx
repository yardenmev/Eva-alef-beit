import React,{useState,useEffect,useRef,useCallback,createContext,useContext} from 'react';
import {FileCard,Header,Closing,FileButton,Link,Routes,Route,useLocalState} from '@instinct/files';
import {letters,finals,games,shuffle,pick,Letter} from './data';
import './style.css';
import {Emoji} from './Emoji';
import {approvedAudio as originalAudio} from './audio';
import {bubbleAudio} from './bubbleAudio';
import {retryAudio} from './retryAudio';
const retryClips:Record<string,string>=retryAudio;
const approvedAudio={...originalAudio,...bubbleAudio,...retryAudio};
type Ctx={pool:Letter[],choices:number,pairs:number,speak:(t:string|string[])=>Promise<boolean>,award:()=>void};
const C=createContext<Ctx>(null!);
// Hosted media policy allows blob sources, not data sources.
const audioSourceCache=new Map<string,string>();
function playableAudio(source:string){
 if(!source.startsWith('data:'))return source;
 const cached=audioSourceCache.get(source);if(cached)return cached;
 const comma=source.indexOf(','),mime=source.slice(5,source.indexOf(';'));
 const binary=atob(source.slice(comma+1)),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 const url=URL.createObjectURL(new Blob([bytes],{type:mime}));audioSourceCache.set(source,url);return url;
}
let activePlayer:HTMLAudioElement|null=null;
let speechGeneration=0;
let cancelPlayback:(()=>void)|null=null;
function stopSpeech(){speechGeneration++;if(cancelPlayback){cancelPlayback();cancelPlayback=null}if(activePlayer){activePlayer.pause();activePlayer.currentTime=0;activePlayer=null}if('speechSynthesis'in window)window.speechSynthesis.cancel()}
function useSpeech(muted:boolean){
 const [status,setStatus]=useState('כל שמות האותיות, המילים וההוראות במשחק משתמשים בקול קבוע שנבדק.');const voice=useRef<SpeechSynthesisVoice|null>(null);
 useEffect(()=>{if(!('speechSynthesis'in window))return;const load=()=>{voice.current=window.speechSynthesis.getVoices().find(v=>/^(he|iw)(-|_|$)/i.test(v.lang))||null};load();window.speechSynthesis.addEventListener('voiceschanged',load);return()=>{window.speechSynthesis.removeEventListener('voiceschanged',load);stopSpeech()}},[]);
 useEffect(()=>{if(muted)stopSpeech()},[muted]);
 const speak=useCallback((text:string|string[])=>{if(muted)return Promise.resolve(true);stopSpeech();const generation=speechGeneration;const parts=Array.isArray(text)?text:[text];
 const play=async()=>{for(const part of parts){if(generation!==speechGeneration)return false;if(approvedAudio[part]){const audio=new Audio(playableAudio(approvedAudio[part]));activePlayer=audio;try{await new Promise<void>((resolve,reject)=>{cancelPlayback=resolve;audio.onended=()=>resolve();audio.onerror=()=>reject(new Error('audio'));const result=audio.play();if(result)result.catch(reject)})}catch{if(generation===speechGeneration)setStatus('לא ניתן להשמיע כרגע. נסי ללחוץ שוב. הטקסט נשאר גלוי.');return false}finally{if(activePlayer===audio){activePlayer=null;cancelPlayback=null}}}else if(voice.current&&'speechSynthesis'in window){await new Promise<void>(resolve=>{cancelPlayback=resolve;const u=new SpeechSynthesisUtterance(part);u.voice=voice.current;u.lang='he-IL';u.rate=.85;u.onend=()=>resolve();u.onerror=()=>resolve();window.speechSynthesis.speak(u)})}else{setStatus('קטעי הקול המאושרים זמינים. לחלק מהטקסט לא נמצא קול עברי במכשיר.');return false}}return generation===speechGeneration};return play();
 },[muted]);return {speak,status};
}
function Listen({text,label='שמעי שוב'}:{text:string|string[],label?:string}){const {speak}=useContext(C);return <FileButton variant="secondary" onClick={()=>speak(text)}>🔊 {label}</FileButton>}
function Menu(){return <><div className="menu">{games.map((g,i)=><Link key={g.id} to={'/'+g.id} className={'game-card c'+i}><span aria-hidden="true" className="icon">{<Emoji value={g.icon}/>}</span><span className="file-hover-underline"><strong>{g.title}</strong><small>{g.detail}</small></span><span aria-hidden="true">←</span></Link>)}</div><p className="hint">אין שעון ואין הפסדים. מותר לנסות שוב ושוב ✿</p></>}
function Game({id,children}:{id:string,children:React.ReactNode}){const {speak}=useContext(C);useEffect(()=>()=>{stopSpeech()},[]);const g=games.find(x=>x.id===id)!;return <section className="play"><Link className="back" to="/"><span aria-hidden="true">→</span> בחזרה למשחקים</Link><h2>{<Emoji value={g.icon}/>} {g.title}</h2>{children}</section>}
function Tile({item,onClick,disabled=false,extra=''}:{item:Letter,onClick:()=>void,disabled?:boolean,extra?:string}){return <button disabled={disabled} onClick={onClick} className={'tile '+extra} aria-label={'האות '+item.name}>{item.letter}</button>}
function Explorer(){const {pool,speak}=useContext(C);const [item,setItem]=useState<Letter|null>(null);const [showFinals,setShowFinals]=useState(false);return <Game id="explorer"><p>לחצי על אות כדי להכיר אותה</p><div className="discovery">{item?<><span className="big-letter">{item.letter}</span><span>{item.name}</span>{!finals.some(f=>f.letter===item.letter)&&<span className="emoji" aria-hidden="true"><Emoji value={item.emoji}/></span>}<strong>{finals.some(f=>f.letter===item.letter)?'אות סופית. האות שבסוף מילה.':item.word}</strong><Listen text={finals.some(f=>f.letter===item.letter)?[item.name]:[item.name,item.word]}/></>:<span className="empty">איזו אות מסקרנת אותך? ✿</span>}</div><div className="alphabet">{pool.map(x=><Tile key={x.letter} item={x} extra={item?.letter===x.letter?'selected':''} onClick={()=>{setItem(x);speak([x.name,x.word])}}/>)}</div><FileButton variant="ghost" onClick={()=>setShowFinals(!showFinals)}>{showFinals?'הסתירי אותיות סופיות':'גם אותיות סופיות ך ם ן ף ץ'}</FileButton>{showFinals&&<><p>אותיות שיש להן צורה מיוחדת בסוף מילה</p><div className="alphabet">{finals.map(x=><Tile key={x.letter} item={x} onClick={()=>{setItem(x);speak(x.name)}}/>)}</div></>}</Game>}
function makeQuestion(id:string,pool:Letter[],choices:number){let target=pick(pool),seq:Letter[]=[];let hole=1;if(id==='train'){const start=Math.floor(Math.random()*(pool.length-2));seq=pool.slice(start,start+3);hole=Math.floor(Math.random()*3);target=seq[hole]}return {target,seq,hole,options:shuffle([target,...shuffle(pool.filter(x=>x.letter!==target.letter)).slice(0,choices-1)])}}
function Quiz({id}:{id:'quiz'|'bubbles'|'train'}){
 const {pool,choices,speak,award}=useContext(C);
 const optionCount=id==='bubbles'?3:choices;
 const [q,setQ]=useState(()=>makeQuestion(id,pool,optionCount));
 const [round,setRound]=useState(0),[correct,setCorrect]=useState(false),[message,setMessage]=useState(''),[wrong,setWrong]=useState<string[]>([]),[done,setDone]=useState(false),[paused,setPaused]=useState(false);
 const answered=useRef(false),nextReady=useRef(false),mounted=useRef(true),generation=useRef(0);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const prompt=id==='quiz'?['באיזו אות מתחילה המילה',q.target.word]:id==='bubbles'?['bubble-'+q.target.letter]:['איזו אות חסרה ברכבת?'];
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++;if(timer.current)clearTimeout(timer.current);stopSpeech()}},[]);
 useEffect(()=>{if(!done&&(id==='quiz'||id==='bubbles'))void speak(prompt);return()=>{stopSpeech()}},[q,done]);
 function next(){if(!nextReady.current||!mounted.current)return;nextReady.current=false;generation.current++;if(timer.current){clearTimeout(timer.current);timer.current=null}stopSpeech();if(round===4){setDone(true);return}setRound(n=>n+1);setQ(makeQuestion(id,pool,optionCount));setCorrect(false);setMessage('');setWrong([]);answered.current=false}
 async function answer(x:Letter){
  if(answered.current)return;
  if(x.letter===q.target.letter){
   answered.current=true;nextReady.current=true;setCorrect(true);setMessage('מצאת! כל הכבוד ★');award();
   const token=++generation.current;
   await speak(['כל הכבוד',q.target.name]);
   if(mounted.current&&token===generation.current)timer.current=setTimeout(next,450);
  }else{
   setWrong(w=>w.includes(x.letter)?w:[...w,x.letter]);
   setMessage(id==='quiz'?'עוד ניסיון. הקשיבי למילה ולחצי על האות הראשונה שלה.':id==='bubbles'?'עוד ניסיון. הקשיבי ונסי בועה אחרת.':'עוד ניסיון. הקשיבי ונסי אות אחרת.');
   if(id==='quiz'||id==='bubbles'){
    const retryKey='retry-'+x.letter;
    const again=id==='quiz'?['באיזו אות מתחילה המילה',q.target.word]:['bubble-'+q.target.letter];
    void speak(retryClips[retryKey]?[retryKey,...again]:'בואי ננסה שוב');
   }else{void speak('בואי ננסה שוב')}
  }
 }
 function restart(){generation.current++;stopSpeech();setDone(false);setRound(0);setQ(makeQuestion(id,pool,optionCount));setCorrect(false);setMessage('');setWrong([]);answered.current=false;nextReady.current=false}
 if(done)return <Game id={id}><div className="celebration"><span>★</span><h3>חמישה גילויים חדשים!</h3><p>כל הכבוד, אווה. אפשר לנוח או לבחור עוד משחק.</p><Link to="/" className="start file-hover-underline">בחירת משחק</Link><FileButton variant="secondary" onClick={restart}>עוד סיבוב</FileButton></div></Game>;
 return <Game id={id}><div className="round"><span>גילוי {round+1} מתוך 5</span><div className="dots" aria-hidden="true">{[0,1,2,3,4].map(n=><i key={n} className={n<=round?'filled':''}/>)}</div></div>
 <p className="instruction">{id==='quiz'?'באיזו אות מתחילה המילה?':id==='bubbles'?'הקשיבי ותפסי את האות הנכונה':'איזו אות חסרה ברכבת?'}</p>
 {id==='quiz'&&<div className="word-card"><span className="emoji" aria-hidden="true"><Emoji value={q.target.emoji}/></span></div>}
 {id==='train'&&<><p className="hint">מתחילות מימין ומתקדמות שמאלה ←</p><div className="train" dir="rtl">{q.seq.map((x,i)=><div key={i} className={'car '+(i===q.hole?'missing':'')}>{i===q.hole&&!correct?'?':x.letter}</div>)}</div></>}
 {!correct&&<Listen text={prompt}/>}
 {id==='bubbles'&&<FileButton variant="ghost" onClick={()=>setPaused(!paused)}>{paused?'המשיכי תנועה':'עצרי תנועה'}</FileButton>}
 <div className={id==='bubbles'?'bubbles drifting'+(paused||correct?' paused':''):'options'}>{q.options.map(x=><Tile key={x.letter} item={x} disabled={correct} extra={(correct&&x.letter===q.target.letter?'selected ':'')+(wrong.includes(x.letter)?'tried':'')} onClick={()=>void answer(x)}/>)}</div>
 <p role="status" aria-live="polite" className="feedback">{message||' '}</p>
 </Game>
}
const previousMemoryBoards=new Map<string,Letter[]>();
function freshMemoryBoard(pool:Letter[],pairs:number,previous:Letter[]=[]){
 let selected=shuffle(pool).slice(0,pairs);const prior=new Set(previous.map(x=>x.letter));
 if(previous.length&&pool.length>pairs&&selected.every(x=>prior.has(x.letter))){const replacement=pick(pool.filter(x=>!prior.has(x.letter)));selected=[replacement,...selected.slice(1)]}
 let board=shuffle(selected.flatMap(x=>[x,x]));
 if(previous.length===board.length&&board.every((x,i)=>x.letter===previous[i].letter)){const j=board.findIndex(x=>x.letter!==board[0].letter);if(j>0)[board[0],board[j]]=[board[j],board[0]]}
 return board;
}
function Memory(){const {pool,pairs,speak,award}=useContext(C);const boardKey=pool.map(x=>x.letter).join('')+':'+pairs;const [deck,setDeck]=useState(()=>freshMemoryBoard(pool,pairs,previousMemoryBoards.get(boardKey)));const [open,setOpen]=useState<number[]>([]);const [matched,setMatched]=useState<string[]>([]);const [moves,setMoves]=useState(0);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const locked=useRef(false);const openRef=useRef<number[]>([]);const matchedRef=useRef<string[]>([]);const complete=matched.length===pairs;
 useEffect(()=>{previousMemoryBoards.set(boardKey,deck)},[boardKey,deck]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 function flip(i:number){if(locked.current||openRef.current.includes(i)||matchedRef.current.includes(deck[i].letter))return;const next=[...openRef.current,i];openRef.current=next;setOpen(next);speak(deck[i].name);if(next.length===2){setMoves(n=>n+1);locked.current=true;if(deck[next[0]].letter===deck[i].letter){const matches=[...matchedRef.current,deck[i].letter];matchedRef.current=matches;setMatched(matches);openRef.current=[];setOpen([]);locked.current=false;award()}else timer.current=setTimeout(()=>{openRef.current=[];setOpen([]);locked.current=false;timer.current=null},1300)}}
 function reset(){stopSpeech();if(timer.current){clearTimeout(timer.current);timer.current=null}setDeck(freshMemoryBoard(pool,pairs,deck));openRef.current=[];matchedRef.current=[];setOpen([]);setMatched([]);setMoves(0);locked.current=false}
 return <Game id="memory"><div className="memory-intro"><p className="memory-kicker">זוג קטן, גילוי גדול</p><p>הופכות שני קלפים ומחפשות אותה אות</p></div><div className="memory-progress" aria-label={matched.length+' מתוך '+pairs+' זוגות'}><span>{matched.length} / {pairs} זוגות</span><div className="pair-dots" aria-hidden="true">{Array.from({length:pairs},(_,i)=><i key={i} className={i<matched.length?'found':''}/>)}</div></div><div className={'memory memory-'+pairs}>{deck.map((x,i)=>{const visible=open.includes(i)||matched.includes(x.letter);const found=matched.includes(x.letter);return <button key={i} className={'memory-card '+(visible?'revealed ':'')+(found?'matched':'')} aria-label={visible?'האות '+x.name:'קלף סגור '+(i+1)} aria-pressed={visible} disabled={found||(!visible&&open.length===2)} onClick={()=>flip(i)}>{visible?<><span className="memory-letter">{x.letter}</span>{found&&<span className="match-mark" aria-hidden="true">✓</span>}</>:<span className="card-back" aria-hidden="true"><span>✿</span></span>}</button>})}</div><p className="feedback" role="status" aria-live="polite">{complete?'מצאת את כל הזוגות! כל הכבוד ★':open.length===2?'נסתכל, נזכור וננסה שוב':open.length===1?'איזה קלף עוד נהפוך?':' '}</p><FileButton variant="secondary" onClick={reset}>משחק חדש ↻</FileButton><p className="memory-note">{pool.length>pairs?'בכל משחק חדש: אותיות אחרות ומקומות חדשים.':'כל אותיות הקבוצה משתתפות. בכל משחק חדש המקומות משתנים.'}</p></Game>}

function Mystery(){const {pool,speak,award}=useContext(C);const [item,setItem]=useState<Letter|null>(null);const bag=useRef<Letter[]>([]);const showing=useRef(false);function reveal(){if(showing.current)return;showing.current=true;if(!bag.current.length)bag.current=shuffle(pool);const x=bag.current.pop()!;setItem(x);speak([x.name,x.word]);award()}return <Game id="mystery"><p>{item?'מה גילינו במתנה?':'לחצי על המתנה. מי מסתתרת בפנים?'}</p>{item?<div className="discovery"><span className="big-letter">{item.letter}</span><span>{item.name}</span><span className="emoji" aria-hidden="true">{<Emoji value={item.emoji}/>}</span><strong>{item.word}</strong><Listen text={[item.name,item.word]}/></div>:<button className="gift" onClick={reveal} aria-label="פתחי את המתנה"><Emoji value='🎁'/></button>}{item&&<FileButton onClick={()=>{stopSpeech();showing.current=false;setItem(null)}}>עוד הפתעה ✦</FileButton>}</Game>}
function makePath(pool:Letter[],rows:number,stones:number,avoid?:string){
 // targets[i] is the letter asked at step i of the climb (bottom row first), so every step asks a different letter.
 const targets:Letter[]=[];
 for(let i=0;i<rows;i++){
  const previous=i===0?avoid:targets[i-1].letter;
  let options=pool.filter(x=>x.letter!==previous&&!targets.some(t=>t.letter===x.letter));
  if(!options.length)options=pool.filter(x=>x.letter!==previous);
  targets.push(pick(options.length?options:pool));
 }
 const grid=Array.from({length:rows},(_,r)=>{
  const target=targets[rows-1-r];
  const others=pool.filter(x=>x.letter!==target.letter);
  const correctIndex=Math.floor(Math.random()*stones);
  const distractors=shuffle(others).slice(0,stones-1);
  return Array.from({length:stones},(_,i)=>({item:i===correctIndex?target:distractors[i<correctIndex?i:i-1],correct:i===correctIndex}));
 });
 return {targets,grid};
}
function Maze(){
 const {pool,pairs,speak,award}=useContext(C);
 const rows=pairs===3?4:pairs===4?5:6;
 const stones=pairs===3?2:3;
 const stages=3;
 const [stage,setStage]=useState(0);
 const [path,setPath]=useState(()=>makePath(pool,rows,stones));
 const [step,setStep]=useState(0);
 const [lanes,setLanes]=useState<number[]>([]);
 const [message,setMessage]=useState(''),[stageDone,setStageDone]=useState(false),[done,setDone]=useState(false),[wrong,setWrong]=useState<string[]>([]);
 const mounted=useRef(true),generation=useRef(0),nextReady=useRef(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const prompt=['מצאי את האות',path.targets[Math.min(step,rows-1)].name];
 const activeRow=rows-1-step;
 const lionRow=rows-lanes.length;
 const lionCol=lanes.length?lanes[lanes.length-1]:-1;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++;if(timer.current)clearTimeout(timer.current);stopSpeech()}},[]);
 useEffect(()=>{if(!done&&!stageDone)void speak(prompt);return()=>{stopSpeech()}},[path,stageDone,done]);
 function next(){
  if(!nextReady.current||!mounted.current)return;nextReady.current=false;generation.current++;
  if(timer.current){clearTimeout(timer.current);timer.current=null}
  stopSpeech();
  if(stage===stages-1){setDone(true);return}
  setStage(n=>n+1);
  const p=makePath(pool,rows,stones,path.targets[path.targets.length-1].letter);setPath(p);setStep(0);setLanes([]);
  setStageDone(false);setMessage('');setWrong([]);
 }
 async function tap(r:number,c:number){
  if(stageDone||done||r!==activeRow)return;
  const stone=path.grid[r][c];
  if(stone.correct){
   const cleared=step+1;
   setStep(cleared);setLanes(l=>[...l,c]);setMessage('');
   if(cleared===rows){
    setStageDone(true);nextReady.current=true;setMessage('מצאת! כל הכבוד ★');award();
    const token=++generation.current;
    await speak(['כל הכבוד',stone.item.name]);
    if(mounted.current&&token===generation.current)timer.current=setTimeout(next,450);
   }else void speak([stone.item.name,'מצאי את האות',path.targets[cleared].name]);
  }else{
   const k=r+','+c;
   setWrong(w=>w.includes(k)?w:[...w,k]);
   setMessage('עוד ניסיון. הקשיבי ונסי אבן אחרת.');
   const retryKey='retry-'+stone.item.letter;
   void speak(retryClips[retryKey]?[retryKey,...prompt]:'בואי ננסה שוב');
  }
 }
 function restart(){generation.current++;stopSpeech();setDone(false);setStage(0);const p=makePath(pool,rows,stones);setPath(p);setStep(0);setLanes([]);setStageDone(false);setMessage('');setWrong([]);nextReady.current=false}
 if(done)return <Game id="maze"><div className="celebration"><span>★</span><h3>שלושה שבילים חדשים!</h3><p>כל הכבוד, אווה. אפשר לנוח או לבחור עוד משחק.</p><Link to="/" className="start file-hover-underline">בחירת משחק</Link><FileButton variant="secondary" onClick={restart}>עוד סיבוב</FileButton></div></Game>;
 return <Game id="maze"><div className="round"><span>שביל {stage+1} מתוך {stages}</span><div className="dots" aria-hidden="true">{[0,1,2].map(n=><i key={n} className={n<=stage?'filled':''}/>)}</div></div>
 <p className="instruction">הקשיבי, ודרכי על האבן עם האות הנכונה</p>
 <p className="hint">עוזרים לאריה לטפס בשביל עד הכוכב ★ בכל צעד מחכה אות חדשה</p>
 <Listen text={prompt}/>
 <div className={'path stones-'+stones} role="group" aria-label="שביל האבנים">
  <div className={'path-goal '+(stageDone?'reached':'')} aria-label="הכוכב">{stageDone?<><Emoji value='🦁'/><span className="goal-star" aria-hidden="true">★</span></>:<span aria-hidden="true">★</span>}</div>
  {path.grid.map((row,r)=>{
   const crossed=r>activeRow||stageDone;
   const active=r===activeRow&&!stageDone;
   return <div key={r} className={'path-row'+(active?' active':'')}>{row.map((stone,c)=>{
    const k=r+','+c;
    if(active)return <button key={k} className={'tile '+(wrong.includes(k)?'tried ':'')} aria-label={'אבן עם האות '+stone.item.name} onClick={()=>void tap(r,c)}>{stone.item.letter}</button>;
    if(crossed&&lanes[rows-1-r]===c){
     const hasLion=!stageDone&&r===lionRow&&c===lionCol;
     return <div key={k} className="tile visited" aria-label={hasLion?'האריה כאן':'אבן שדרכנו עליה'}>{hasLion&&<Emoji value='🦁'/>}</div>;
    }
    return <div key={k} className="tile plain" aria-hidden="true"/>;
   })}</div>;
  })}
  <div className="path-start" aria-hidden="true">{step===0&&!stageDone?<Emoji value='🦁'/>:<Emoji value='🌷'/>}</div>
 </div>
 <p role="status" aria-live="polite" className="feedback">{message||' '}</p>
 </Game>
}
export function App(){const [level,setLevel]=useState('22');const [difficulty,setDifficulty]=useState('easy');const [muted,setMuted]=useState(false);const [settings,setSettings]=useState(false);const [stars,setStars,saved]=useLocalState('eva-stars.v1',0);const starsRef=useRef(stars);useEffect(()=>{starsRef.current=stars},[stars]);const {speak,status}=useSpeech(muted);const pool=letters.slice(0,Number(level));const award=()=>{if(saved.ready){starsRef.current++;setStars(starsRef.current)}};return <C.Provider value={{pool,choices:difficulty==='easy'?2:4,pairs:difficulty==='easy'?3:difficulty==='medium'?4:6,speak,award}}><div dir="rtl" lang="he" className="eva"><FileCard><Header title="המשחקים של אווה"/><div className="toolbar"><span className="star-count">★ {stars} גילויים</span><FileButton compact variant="ghost" onClick={()=>{setMuted(!muted);if(!muted)stopSpeech()}}>{muted?'🔇 ביטול השתקה':'🔊 השתקה'}</FileButton><FileButton compact variant="ghost" onClick={()=>setSettings(!settings)}>{settings?'סגירה':'להורים ⚙'}</FileButton></div><p className="audio-note">כל האותיות, המילים וההוראות בקול קבוע.</p>{settings&&<section className="settings"><h2>משחק שמתאים לה</h2><fieldset><legend>אילו אותיות מתרגלות?</legend><div className="choices">{[['6','א-ו'],['12','א-ל'],['22','כל האותיות']].map(([v,l])=><FileButton key={v} variant="secondary" selected={level===v} onClick={()=>setLevel(v)}>{l}</FileButton>)}</div></fieldset><fieldset><legend>רמת האתגר</legend><div className="choices">{[['easy','צעדים קטנים'],['medium','עוד קצת'],['hard','אתגר']].map(([v,l])=><FileButton key={v} variant="secondary" selected={difficulty===v} onClick={()=>setDifficulty(v)}>{l}</FileButton>)}</div></fieldset><p>צעדים קטנים: שתי תשובות בשאלות, שלוש בועות ו־3 זוגות. עוד קצת: ארבע תשובות ו־4 זוגות. אתגר: ארבע תשובות ו־6 זוגות. שינוי ההגדרות מתחיל את המשחק הנוכחי מחדש.</p><FileButton variant="secondary" onClick={()=>speak('שלום אווה, בואי נשחק באותיות')}>🔊 בדיקת קול בעברית</FileButton><p role="status">{status}</p><p>שמות 22 האותיות, חמש האותיות הסופיות, 22 המילים והוראות ההקראה משתמשים בקטעי קול קבועים שאושרו בהאזנה. אין צורך בקול עברי שמותקן במכשיר. אם ההשמעה נכשלת, הטקסט נשאר גלוי ואפשר לנסות שוב.</p><p>מספר הגילויים נשמר במכשיר ובחשבון הזה בלבד, אם השמירה זמינה. זהו מונה משחק, לא מדד לשליטה באותיות.</p><p className="storage">{saved.message}</p><p>אין הקלטת קול, מצלמה, פרסומות או קישורים החוצה במשחק. זיהוי אות ראשונה הוא שלב אחד בלמידה, ולא תוכנית קריאה מלאה.</p></section>}<div key={level+difficulty}><Routes><Route path="/" element={<Menu/>}/><Route path="/explorer" element={<Explorer/>}/><Route path="/quiz" element={<Quiz id="quiz"/>}/><Route path="/bubbles" element={<Quiz id="bubbles"/>}/><Route path="/train" element={<Quiz id="train"/>}/><Route path="/memory" element={<Memory/>}/><Route path="/mystery" element={<Mystery/>}/><Route path="/maze" element={<Maze/>}/></Routes></div><Closing>קצת בכל פעם, יחד ובכיף ✿</Closing></FileCard></div></C.Provider>}

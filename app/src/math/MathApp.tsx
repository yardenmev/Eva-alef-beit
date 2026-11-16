import React, {useState, useRef, useEffect} from 'react';
import {useLocalState} from '../ui';
import {useNavigate} from 'react-router-dom';
import './math.css';
import apple from './art/apple.svg';
import pear from './art/pear.svg';
import orange from './art/orange.svg';
import strawberry from './art/strawberry.svg';
import lion from './art/lion.svg';
import speaker from './art/speaker.svg';
import {clips} from './mathClips';
const fruitArt=[apple,pear,orange,strawberry];
const sequences=[[2,1,3,2,3,1],[4,2,5,3,1,4],[6,8,7,9,10,5,3,8,10,7]];
const comparePairs=[[1,3],[3,2],[2,4],[5,3],[4,1],[3,5],[4,5],[2,3]];
const countKeys=['','one','two','three','four','five','six','seven','eight','nine','ten'];
function mix<T>(xs:T[]):T[]{const result=[...xs];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function choices(n:number,stage:number){return mix([n,...mix(Array.from({length:[3,5,10][stage]},(_,i)=>i+1).filter(x=>x!==n)).slice(0,stage===0?1:2)])}
export function MathApp(){return <Game/>}
function Game(){
 const [progress,setProgress,saved]=useLocalState('picnic.progress.v2',{stage:0,round:0,compareRound:0,unlocked:0});
 const [mathProgress,setMathProgress,mathSaved]=useLocalState('picnic.arithmetic.v1',{addRound:0,subRound:0});
 const [screen,setScreen]=useState<'home'|'count'|'compare'|'add'|'sub'>('home');
 const navigate=useNavigate();
 const [phase,setPhase]=useState<'ready'|'moving'|'after'>('ready');
 const phaseRef=useRef<'ready'|'moving'|'after'>('ready');
 const sceneTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const arith=screen==='add'||screen==='sub';
 const [round,setRound]=useState(0);
 const [stage,setStage]=useState(0);
 const [n,setN]=useState(2);
 const [fruitType,setFruitType]=useState(0);
 const [pair,setPair]=useState([1,3]);
 const [options,setOptions]=useState([1,2]);
 const [marked,setMarked]=useState<string[]>([]);
 const counted=useRef(new Set<string>());
 const [state,setState]=useState<'ask'|'retry'|'success'|'advance'>('ask');
 const answered=useRef(false);
 const [muted,setMuted]=useState(false);
 const [audioError,setAudioError]=useState(false);
 const autoTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const cancelAdvance=()=>{if(autoTimer.current!==null){clearTimeout(autoTimer.current);autoTimer.current=null}};
 useEffect(()=>()=>{cancelAdvance();if(sceneTimer.current!==null)clearTimeout(sceneTimer.current)},[]);
 const player=useRef<AudioBufferSourceNode|null>(null);
 const context=useRef<AudioContext|null>(null);
 const decoded=useRef<Record<string,AudioBuffer>>({});
 const queue=useRef<string[]>([]);
 const busy=useRef(false);
 const countingVoice=useRef(false);
 const epoch=useRef(0);
 const muteRef=useRef(false);
 const stop=()=>{epoch.current++;queue.current=[];busy.current=false;if(player.current){try{player.current.stop()}catch{}player.current=null}};
 const drain=async()=>{if(busy.current||muteRef.current)return;const key=queue.current.shift();if(!key)return;const src=clips[key];if(!src){setAudioError(true);return}busy.current=true;const token=epoch.current;const done=()=>{if(token!==epoch.current)return;busy.current=false;player.current=null;void drain()};try{if(!context.current)context.current=new AudioContext();const ctx=context.current;await ctx.resume();if(!decoded.current[key]){const raw=atob(src.split(',')[1]);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));decoded.current[key]=await ctx.decodeAudioData(bytes.buffer)}if(token!==epoch.current)return;const node=ctx.createBufferSource();node.buffer=decoded.current[key];node.connect(ctx.destination);node.onended=done;player.current=node;node.start();setAudioError(false)}catch{setAudioError(true);done()}};
 const say=(key:string,append=false)=>{if(muteRef.current)return;if(!append||!countingVoice.current)stop();countingVoice.current=append;queue.current.push(key);drain()};
 useEffect(()=>()=>{stop();void context.current?.close()},[]);

 const clear=()=>{cancelAdvance();if(sceneTimer.current!==null){clearTimeout(sceneTimer.current);sceneTimer.current=null;}counted.current=new Set();setMarked([]);answered.current=false};
 const remember=(changes:Partial<typeof progress>)=>{if(saved.ready)setProgress({...progress,...changes})};
 const newCount=(index:number,level:number)=>{stop();clear();const seq=sequences[level],value=seq[index%seq.length];setScreen('count');setFruitType((index+level)%fruitArt.length);setRound(index);setN(value);setStage(level);setOptions(choices(value,level));setState('ask');say('question')};
 const newCompare=(index:number)=>{stop();clear();setScreen('compare');setFruitType(index%fruitArt.length);setRound(index);setPair(mix(comparePairs[index%comparePairs.length]));setState('ask');say('more')};
 const newArithmetic=(kind:'add'|'sub',index:number)=>{stop();clear();const start=kind==='add'?[2,1,3,4,2,3,1,4][index%8]:[3,2,4,5,3,5,2,4][index%8];const result=start+(kind==='add'?1:-1);setScreen(kind);setRound(index);setFruitType(index%fruitArt.length);setN(start);setPhase('ready');phaseRef.current='ready';setOptions(choices(result,1));setState('ask');say(kind+'Intro')};
 const animateChange=()=>{if(phaseRef.current!=='ready')return;stop();counted.current=new Set();setMarked([]);phaseRef.current='moving';setPhase('moving');sceneTimer.current=setTimeout(()=>{sceneTimer.current=null;phaseRef.current='after';setPhase('after');say(screen+'Question')},1400)};
 const replayScene=()=>{stop();clear();setState('ask');setPhase('ready');phaseRef.current='ready';say(screen+'Intro')};
 const replay=()=>say(arith?screen+(phase==='ready'?'Intro':'Question'):screen==='compare'?'more':'question');
 const begin=()=>{if(saved.ready)newCount(progress.round,progress.stage)};
 const count=(side:number,index:number)=>{const id=side+'-'+index;if(answered.current||counted.current.has(id))return;counted.current.add(id);setMarked([...counted.current]);const amount=[...counted.current].filter(k=>k.startsWith(side+'-')).length;say(countKeys[amount],true)};
 const answer=(correct:boolean)=>{if(answered.current)return;if(correct){answered.current=true;const advance=screen==='count'&&stage<2&&round===sequences[stage].length-1;setState(advance?'advance':'success');if(screen==='count')remember(advance?{stage:stage+1,round:0,unlocked:Math.max(progress.unlocked,stage+1)}:{stage,round:round+1});else if(screen==='compare')remember({compareRound:round+1});else if(mathSaved.ready)setMathProgress({...mathProgress,[screen==='add'?'addRound':'subRound']:round+1});say('success');const advanceWhenQuiet=()=>{if(busy.current||queue.current.length){autoTimer.current=setTimeout(advanceWhenQuiet,100);return}autoTimer.current=null;if(screen==='add'||screen==='sub')newArithmetic(screen,round+1);else if(screen==='compare')newCompare(round+1);else if(advance)newCount(0,stage+1);else newCount(round+1,stage)};autoTimer.current=setTimeout(advanceWhenQuiet,3600)}else{setState('retry');say(arith?screen+'Retry':screen==='count'?'retry':'compareRetry')}};

 const home=()=>{stop();setScreen('home');clear();setState('ask')};
 const toggle=()=>{stop();muteRef.current=!muteRef.current;setMuted(muteRef.current);setAudioError(false)};
 const fruits=(amount:number,side:number)=><div className="fruit-grid">{Array.from({length:amount},(_,i)=>{const id=side+'-'+i;return <button key={screen+'-'+round+'-'+stage+'-'+id} className={'fruit '+(marked.includes(id)?'counted':'')} onClick={()=>count(side,i)} aria-label={marked.includes(id)?'פרי שכבר ספרנו':'סופרים פרי'} aria-pressed={marked.includes(id)} disabled={answered.current}><img src={fruitArt[fruitType]} alt=""/>{marked.includes(id)&&<span className="check" aria-hidden="true">✓</span>}</button>})}</div>;
 const question=arith?(phase==='ready'?(screen==='add'?'מוכנה לעוד פרי?':'ניתן לאריה פרי אחד?'):(screen==='add'?'כמה פירות יש עכשיו?':'כמה פירות נשארו?')):screen==='compare'?'איפה יש יותר פירות?':'כמה פירות יש כאן?';
 const won=state==='success'||state==='advance';
 return <div className="picnic" dir="rtl">
 <nav className="m-toolbar" aria-label="ניווט במשחק"><button className="m-back" onClick={()=>{if(screen!=='home')home();else navigate('/')}}>{screen!=='home'?'→ למשחקי החשבון':'→ לכל המשחקים'}</button><button className="sound" onClick={toggle} aria-label={muted?'הפעלת קול':'השתקת קול'} aria-pressed={muted}>{muted?<span aria-hidden="true">♪ ×</span>:<img src={speaker} alt=""/>}</button></nav>
 <div className="m-eyebrow">חשבון עם אווה</div><header className="m-header"><h1>{screen==='add'?'סל הקסמים':screen==='sub'?'האריה רעב':screen==='compare'?'איפה יש יותר?':'הפיקניק של האריה'}</h1></header><p className="subtitle">{arith?(screen==='add'?'עוד פרי מגיע, והסל מתמלא':'פרי אחד לאריה, והשאר נשארים'):screen==='compare'?'פירות צבעוניים, כמויות מגלים':'מגלים מספרים, פרי אחרי פרי'}</p>
 {screen==='home'?<>
 <section className="m-welcome menu-welcome"><div className="hero"><img className="hero-lion" src={lion} alt="אריה מחייך"/><img className="hero-apple a" src={apple} alt=""/><img className="hero-apple b" src={pear} alt=""/></div><h2>מה נשחק היום?</h2><p>בוחרים משחק וסופרים יחד.</p></section>
 <div className="game-menu"><button className="game-choice" onClick={begin} disabled={!saved.ready}><span className="game-icon" aria-hidden="true">1 2 3</span><span><strong>סופרים לפיקניק</strong><small>{progress.round||progress.stage?'ממשיכים מהמקום שבו עצרנו':'מתחילים בכמויות קטנות'}</small></span><span aria-hidden="true">←</span></button>
 <button className="game-choice" onClick={()=>saved.ready&&newCompare(progress.compareRound)} disabled={!saved.ready}><span className="game-icon compare-icon" aria-hidden="true"><i/><i/><i/></span><span><strong>איפה יש יותר?</strong><small>סופרים בשני הצדדים ומשווים</small></span><span aria-hidden="true">←</span></button>
 <button className="game-choice" onClick={()=>newArithmetic('add',mathProgress.addRound)} disabled={!mathSaved.ready}><span className="game-icon" aria-hidden="true">עוד</span><span><strong>סל הקסמים</strong><small>עוד פרי מצטרף לסל</small></span><span aria-hidden="true">←</span></button>
 <button className="game-choice" onClick={()=>newArithmetic('sub',mathProgress.subRound)} disabled={!mathSaved.ready}><span className="game-icon" aria-hidden="true">נשאר</span><span><strong>האריה רעב</strong><small>פרי אחד לאריה, כמה נשארו?</small></span><span aria-hidden="true">←</span></button></div>
 <div className="levels" aria-label="בחירת טווח מספרים">{[3,5,10].map((max,i)=><button key={max} disabled={!saved.ready||i>progress.unlocked} onClick={()=>newCount(0,i)}>{i>progress.unlocked?'🔒 ':''}עד {max}</button>)}</div>
 <p className="storage-note">ההתקדמות נשמרת בדפדפן הזה בלבד.<br/>{saved.message}</p>
 </>:<>
 <section className={'m-play '+(screen==='compare'?'compare-play':'')} aria-label={arith?'מצטרפים ונפרדים':screen==='compare'?'השוואת כמויות':'ספירת פירות'}>
 <h2>{question}</h2><button className="replay" disabled={won||phase==='moving'&&arith} onClick={replay}><img src={speaker} alt=""/>שומעים שוב</button>
 {arith?<>
 <div className={'arithmetic-scene '+screen+' phase-'+phase} aria-label={screen==='add'?'סל פירות':'צלחת פירות והאריה'}>
 <div className="scene-label">{screen==='add'?'הסל שלנו':'הצלחת שלנו'}</div>
 <div className={'arithmetic-fruits '+(screen==='add'?'basket':'plate')}>
 {Array.from({length:screen==='add'?n+1:n},(_,i)=>{const changed=i===(screen==='add'?n:n-1),present=!changed||(screen==='add'?phase!=='ready':phase==='ready'),active=phase==='after'&&present,id='0-'+i;return <button key={round+'-'+i} disabled={won||!present||phase==='moving'} onClick={()=>{if(present)count(0,i)}} aria-label={!present?'':marked.includes(id)?'פרי שכבר ספרנו':'סופרים פרי'} aria-hidden={!present} aria-pressed={marked.includes(id)} className={'arith-fruit '+(changed?'changing ':'')+(!present?'absent ':'')+(marked.includes(id)?'counted':'')}><img src={fruitArt[fruitType]} alt=""/>{marked.includes(id)&&<span className="check" aria-hidden="true">✓</span>}</button>})}
 </div>
 {screen==='sub'&&<div className="hungry-lion"><img src={lion} alt="האריה"/><span>{phase==='ready'?'אני רעב':phase==='moving'?'יאם!':'תודה!'}</span>{phase!=='ready'&&<img className="lion-snack" src={fruitArt[fruitType]} alt="פרי שניתן לאריה, לא סופרים אותו"/>}</div>}
 </div>
 {phase==='ready'?<><p className="choose">אפשר לספור לפני שמתחילים</p><button className="primary change-action" onClick={animateChange}>{screen==='add'?'מוסיפים פרי אחד':'נותנים לאריה פרי אחד'}</button></>:phase==='moving'?<p className="motion-note" role="status">{screen==='add'?'עוד פרי בדרך לסל…':'פרי אחד עובר לאריה…'}</p>:<><p className="choose">{screen==='add'?'סופרים את כל הפירות בסל':'סופרים רק את הפירות בצלחת'}</p><div className="answers">{options.map(value=><button className={'number '+(won&&value===n+(screen==='add'?1:-1)?'correct':'')} key={value} onClick={()=>answer(value===n+(screen==='add'?1:-1))} disabled={won} aria-label={'המספר '+value}>{value}</button>)}</div><button className="replay scene-replay" disabled={won} onClick={replayScene}>רואים שוב מה קרה</button></>}
 </>:screen==='count'?<><div className={'scene amount-'+n+(n>5?' many':'')} aria-label="פירות לפיקניק"><div className="blanket"/>{fruits(n,0)}</div><p className="choose">נוגעים במספר המתאים</p><div className="answers">{options.map(value=><button className={'number '+(won&&value===n?'correct':'')} key={value} onClick={()=>answer(value===n)} disabled={won} aria-label={'המספר '+value}>{value}</button>)}</div></>:<>
 <div className="mats">{pair.map((amount,side)=><div className="mat-group" key={side}><div className={'scene compare-scene amount-'+amount} aria-label={side===0?'הצד הוורוד':'הצד הכחול'}><div className="blanket"/>{fruits(amount,side)}</div><button className={'mat-choice '+(side===0?'rose':'blue')+(won&&amount>pair[1-side]?' correct':'')} onClick={()=>answer(amount>pair[1-side])} disabled={won} aria-label={side===0?'בוחרים בצד הוורוד':'בוחרים בצד הכחול'}>בצד הזה</button></div>)}</div><p className="choose">סופרים בכל צד, ואז בוחרים</p>
 </>}
 <div className={'m-feedback '+state} role="status" aria-live="polite">{state==='retry'?'בואי נספור יחד וננסה שוב':state==='advance'?'כל הכבוד! מוכנה לעוד פירות?':state==='success'?'כל הכבוד! הצלחת!':'אפשר לספור בקצב שלך'}</div>

 </section>
 <button className="lion-hint" disabled={won||arith&&phase==='moving'} onClick={()=>say(arith?(phase==='ready'?screen+'Intro':screen+'Hint'):screen==='compare'?'compareHint':'hint')} aria-label="עזרה מהאריה"><img src={lion} alt=""/><span>{arith?<>{phase==='ready'?'נוגעים בכפתור כדי להתחיל':screen==='add'?'סופרים את כל הפירות בסל':'סופרים רק מה שנשאר בצלחת'}</>:screen==='compare'?<>סופרים בכל צד<br/>ואז בוחרים איפה יש יותר</>:<>אפשר לגעת בכל פרי<br/>ולספור יחד איתי</>} <img src={speaker} alt=""/></span></button>
 </>}
 {audioError&&<p className="audio-error" role="alert">הקול לא הופעל. אפשר ללחוץ על ״שומעים שוב״ או להמשיך בלי קול.</p>}
 
 </div>
}
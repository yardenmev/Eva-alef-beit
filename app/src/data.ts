export const letters = [
 ['א','אָלֶף','אַרְיֵה','🦁'],['ב','בֵּית','בָּנָנָה','🍌'],['ג','גִּימֶל','גָּמָל','🐪'],['ד','דָּלֶת','דּוּבִּי','🧸'],['ה','הֵא','הַר','⛰️'],['ו','וָו','וֶרֶד','🌹'],['ז','זַיִן','זֶבְּרָה','🦓'],['ח','חֵית','חָצִיל','🍆'],['ט','טֵית','טַבַּעַת','💍'],['י','יוֹד','יַלְדָּה','👧'],['כ','כַּף','כַּדּוּר','⚽'],['ל','לָמֶד','לִימוֹן','🍋'],['מ','מֵם','מְכוֹנִית','🚗'],['נ','נוּן','נָמֵר','🐆'],['ס','סָמֶךְ','סוּס','🐎'],['ע','עַיִן','עַגְבָנִיָּה','🍅'],['פ','פֵּא','פִּיל','🐘'],['צ','צָדִי','צִפּוֹר','🐦'],['ק','קוֹף','קוֹף','🐒'],['ר','רֵישׁ','רִמּוֹן','🍎'],['ש','שִׁין','שֶׁמֶשׁ','☀️'],['ת','תָּו','תַּפּוּחַ','🍎']
].map(([letter,name,word,emoji])=>({letter,name,word,emoji}));
// A crown is not a head, and the apple emoji is not a pomegranate. Use a clear familiar example.
letters[19] = {letter:'ר',name:'רֵישׁ',word:'רוֹבּוֹט',emoji:'🤖'};
export const finals = [['ך','כ'],['ם','מ'],['ן','נ'],['ף','פ'],['ץ','צ']].map(([letter,base])=>({...letters.find(x=>x.letter===base)!,letter,name:letters.find(x=>x.letter===base)!.name+' סוֹפִית'}));
export type Letter = typeof letters[number];
export const games = [
 {id:'explorer',icon:'🔎',title:'מגלות אותיות',detail:'נוגעות, שומעות ומכירות'},
 {id:'quiz',icon:'🍎',title:'מה האות הראשונה?',detail:'מילה, תמונה ואות מתאימה'},
 {id:'memory',icon:'🧠',title:'זוגות של אותיות',detail:'מוצאות שתי אותיות זהות'},
 {id:'bubbles',icon:'🫧',title:'בועות של אותיות',detail:'מחפשות בנחת, בלי למהר'},
 {id:'train',icon:'🚂',title:'רכבת האותיות',detail:'איזו אות חסרה ברצף?'},
 {id:'mystery',icon:'🎁',title:'תיבת ההפתעות',detail:'בכל מתנה מסתתרת אות'},
 {id:'maze',icon:'🦁',title:'שביל האותיות',detail:'צועדים עם האריה, בכל צעד אות חדשה'}
];
export function shuffle<T>(items:T[]):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function pick<T>(items:T[]):T{return items[Math.floor(Math.random()*items.length)]}

export const COMPANIONS={
 human:{name:'Lena',kind:'human',gender:'female',price:0,hair:'#845237',coat:'#be7b91'},
 humanMale:{name:'Noah',kind:'human',gender:'male',price:0,hair:'#493d37',coat:'#6386b8'},
 robot:{name:'Ari-7',kind:'robot',gender:'male',price:100,hair:'#263340',coat:'#4a9490'},
 androidFemale:{name:'Nova-8',kind:'robot',gender:'female',price:100,hair:'#f2ce59',coat:'#6578c7'},
};
export function companionArt(id){
 const a=COMPANIONS[id];if(!a)return null;
 return `<path d="M83 108v32m33-32v32" stroke="#344a61" stroke-width="12"/><path d="M77 69q23-12 46 0l10 43H67z" fill="${a.coat}"/><path d="M79 69 62 110m59-41 17 41" stroke="#dab18e" stroke-width="10"/><path d="M79 48q-4-33 23-32t23 34v${a.gender==='female'?26:9}H79z" fill="${a.hair}"/><ellipse cx="102" cy="46" rx="17" ry="21" fill="#e3bb98"/><path d="M83 37q10-31 38-10l5 14-16-9-27 5" fill="${a.hair}"/><circle cx="96" cy="45" r="2" fill="#28465c"/><circle cx="110" cy="45" r="2" fill="#28465c"/><path d="M98 56q5 4 9 0" stroke="#8f5c54" fill="none"/>${a.kind==='robot'?'<path d="M92 79h19v15H92z" fill="#a5f4ef"/><path d="M122 48v13" stroke="#7de8ed" stroke-width="3"/>':''}`;
}

/* Подготовка текста к озвучке: синтезатор не должен читать знаки вслух */
function forSpeech(s){
  return String(s).replace(/[«»"„“”「」『』]/g,'')
    .replace(/\s*[—–]\s*/g,', ')
    .replace(/\s+-\s+/g,', ')
    .replace(/\s*[：；]\s*/g,'，')
    .replace(/\s*[:;؛]\s*/g,', ')
    .replace(/(\p{L})-(?=\p{L})/gu,'$1 ')
    .replace(/[()（）]/g,'')
    .replace(/,\s*,/g,',')
    .replace(/[,，]\s*([.!?。！？؟])/g,'$1')
    .replace(/\s+/g,' ').trim();
}
/* по фразам: так паузы естественнее, а длинный текст не обрывается */
function splitSentences(s){return s.split(/(?<=[.!?…。！？।؟])\s*/).map(x=>x.trim()).filter(Boolean);}
/* имя аудиофайла для фразы (его же пишет tools/export_phrases.js) */
function phraseHash(s){let h=5381;for(const ch of s){h=(Math.imul(h,33)+ch.codePointAt(0))>>>0;}return h.toString(36);}

import { useI18n } from './i18n';
import React, { useState } from 'react';
import media from './data/media.json';
export default function Photo({
  poi,
  compact = false,
  eager = false
}) {
  const {
    t
  } = useI18n();
  const m = media[poi.id];
  const [failedSrc, setFailedSrc] = useState(null);
  const available = m && failedSrc !== m.src;
  return <div className={'photo ' + (compact ? 'compact' : '')} style={{
    '--photo-landscape-position': m?.crop?.landscape || m?.position || '50% 50%',
    '--photo-portrait-position': m?.crop?.portrait || m?.position || '50% 50%'
  }}>
  {available ? <>
   <img src={m.src.replace(/^\//, import.meta.env.BASE_URL)} alt={t(m.alt)} loading={eager?'eager':'lazy'} decoding="async" width={m.width} height={m.height} onError={() => setFailedSrc(m.src)} />
   {compact ? <span className="photo-credit">{t(m.short_label) || t('地点实景')}</span> : <span className="photo-credit">
    <span>{t(m.caption) || t(m.alt)}</span>
    <a href={m.source_url} target="_blank" rel="noreferrer">{t(m.author) || t('图片来源')} ↗</a>
    {m.license && <>{' · '}{m.license_url ? <a href={m.license_url} target="_blank" rel="noreferrer">{t(m.license)}</a> : t(m.license)}{t(' · 裁切缩放')}</>}
   </span>}
  </> : <div className="archive-art"><span>{t("LES HISTOIRES DE PARIS")}</span><svg viewBox="0 0 600 230" aria-hidden="true"><path d="M0 208H600M25 208V80H140V208M20 80L83 40L147 80M172 208V112H302V208M192 112V80H282V112M333 208V67H478V208M350 67V36H460V67M505 208V120H590V208" /><path d="M43 109H67V147H43ZM97 109H121V147H97ZM205 137H227V170H205ZM253 137H275V170H253ZM355 93H381V123H355ZM427 93H454V123H427ZM356 157H380V208M428 208V157H453V208M528 146H566V181H528Z" /></svg><strong>{t(poi.name_fr)}</strong><small>{m ? t('照片暂时未能加载 · 城市意象插画') : t('城市意象插画，非地点实景')}</small></div>}
 </div>;
}

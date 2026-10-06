import { useI18n } from './i18n';
import React, { lazy, Suspense } from 'react';
const Map = lazy(() => import('./MapView'));
export default function LazyMap(props) {
  const {
    t
  } = useI18n();
  return <Suspense fallback={<div className={'map-shell map-loading '+(props.expanded?'expanded-map':'')}><span>{t("正在展开地点地图…")}</span><small>{t("点击地图地点，打开对应的故事。")}</small></div>}><Map {...props} /></Suspense>;
}

import { useI18n } from './i18n';
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {Maximize} from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import paths from './data/paths.json';
import MapOverview from './MapOverview';
import {routeSegments,segmentFeatures} from './route-paths.mjs';
import {mapPoints,spreadPointLabels} from './map-points.mjs';
export default function MapView({
  route,
  selected = 0,
  onSelect,
  onClear,
  expanded = false
}) {
  const {
    t,
    language
  } = useI18n();
  const el = useRef(),
    map = useRef(),
    callback = useRef(onSelect);
  callback.current = onSelect;
  const markerRefs = useRef([]),
    fit = useRef(() => {});
  const initialFocus = useRef(true);
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
  const [mapSize,setMapSize] = useState(0);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const points = mapPoints(route);
  const segments = expanded ? routeSegments(route,paths) : [];
  const located = route.stops.map((s, i) => ({
    ...s,
    index: i
  })).filter(s => Number.isFinite(s.poi.coordinates?.lon) && Number.isFinite(s.poi.coordinates?.lat));
  useEffect(() => {
    let timer;
    try {
      const m = new maplibregl.Map({
        container: el.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [2.337, 48.859],
        zoom: 12,
        attributionControl: true
      });
      map.current = m;
      m.addControl(new maplibregl.NavigationControl({
        showCompass: false
      }), 'top-right');
      m.once('load', () => {
        clearTimeout(timer);
        setReady(true);
        setFailed(false);
      });
      timer = setTimeout(() => setFailed(!m.isStyleLoaded()), 15000);
      const resize = new ResizeObserver(() => {m.resize();setMapSize(n=>n+1);});
      resize.observe(el.current);
      return () => {
        resize.disconnect();
        clearTimeout(timer);
        m.remove();
        map.current = null;
      };
    } catch {
      setFailed(true);
    }
  }, []);
  const signature = points.map(s => s.id+':'+s.indexes.join(',')).join('|');
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    m.resize();
    const coords = points.map(s => [s.poi.coordinates.lon, s.poi.coordinates.lat]);
    const geo = segmentFeatures(segments);
    if (m.getSource('route-lines')) m.getSource('route-lines').setData(geo);else {
      m.addSource('route-lines',{type:'geojson',data:geo,attribution:'Routing: <a href="https://routing.openstreetmap.de/about.html" target="_blank">FOSSGIS</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank">Fix the map</a>'});
      m.addLayer({id:'route-lines',type:'line',source:'route-lines',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#bd4935','line-width':4,'line-opacity':.8}});
      m.addLayer({id:'route-selected',type:'line',source:'route-lines',filter:['==','index',-1],paint:{'line-color':'#963b29','line-width':7,'line-opacity':.32}});
      const canvas=document.createElement('canvas');canvas.width=24;canvas.height=24;
      const c=canvas.getContext('2d');c.strokeStyle='#fffdf6';c.lineWidth=4;c.fillStyle='#9c402f';c.beginPath();c.moveTo(12,3);c.lineTo(21,20);c.lineTo(12,16);c.lineTo(3,20);c.closePath();c.stroke();c.fill();
      m.addImage('route-direction',c.getImageData(0,0,24,24));
      m.addLayer({id:'route-arrows',type:'symbol',source:'route-lines',layout:{'symbol-placement':'line','symbol-spacing':140,'icon-image':'route-direction','icon-size':.65,'icon-rotate':90,'icon-rotation-alignment':'map','icon-allow-overlap':true}});
    }
    const markers = points.map((s, j) => {
      const b = document.createElement('button');
      b.className = 'map-marker';
      b.textContent = s.indexes.length>1 ? `${s.index+1}–${s.indexes.at(-1)+1}` : s.index+1;
      b.dataset.stopIndex = s.index;
      b.title = t(s.name);
      b.setAttribute('aria-label', t('地图第{0}站 {1}', s.indexes.map(n=>n+1).join(' / '), t(s.name)));
      b.onclick = () => callback.current?.(s.index);
      const marker = new maplibregl.Marker({
        element: b
      }).setLngLat(coords[j]).addTo(m);
      b.setAttribute('aria-label', t('地图第{0}站 {1}', s.indexes.map(n=>n+1).join(' / '), t(s.name)));
      return marker;
    });
    markerRefs.current = markers.map((marker, j) => ({
      marker,
      index: points[j].index,
      indexes: points[j].indexes,
      name: points[j].name
    }));
    const spreadMarkers=()=>{
      if(!expanded)return;
      const projected=coords.map(c=>m.project(c));
      const labels=spreadPointLabels(projected,46,{width:el.current.clientWidth,height:el.current.clientHeight});
      markers.forEach((marker,i)=>marker.setOffset(labels[i].offset));
      const leaders={type:'FeatureCollection',features:labels.flatMap((label,i)=>Math.hypot(...label.offset)>1?[{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[coords[i],m.unproject([label.x,label.y]).toArray()]}}]:[])};
      if(m.getSource('pin-leaders'))m.getSource('pin-leaders').setData(leaders);
      else {m.addSource('pin-leaders',{type:'geojson',data:leaders});m.addLayer({id:'pin-leaders',type:'line',source:'pin-leaders',paint:{'line-color':'#607b5a','line-width':1,'line-opacity':.65}});}
    };
    m.on('move',spreadMarkers);
    fit.current = () => {
      if (coords.length) {
        const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
        m.fitBounds(bounds, {
          padding: 55,
          maxZoom: 15,
          duration: motion()
        });
      }
    };
    fit.current();
    spreadMarkers();
    initialFocus.current = true;
    return () => {
      m.off('move',spreadMarkers);
      markers.forEach(x => x.remove());
      markerRefs.current = [];
    };
  }, [ready, signature, route.persona_id]);
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setFilter('route-selected',['==','index',selected ?? -1]);
    markerRefs.current.forEach(({
      marker,
      indexes
    }) => {
      marker.getElement().classList.toggle('selected', indexes.includes(selected));
      marker.getElement().setAttribute('aria-pressed', String(indexes.includes(selected)));
    });
    if (initialFocus.current) {
      initialFocus.current = false;
      if (!expanded || selected === null) return;
    }
    if(expanded&&selected===null){fit.current();return;}
    const p = route.stops[selected]?.poi.coordinates;
    if (Number.isFinite(p?.lon) && Number.isFinite(p?.lat)) map.current.easeTo({
      center: [p.lon, p.lat],
      zoom: Math.max(map.current.getZoom(), 14),
      offset: expanded ? (matchMedia('(max-width: 760px)').matches ? [0,-130] : [180,0]) : [0,0],
      duration: motion()
    });
  }, [selected, signature, ready, expanded ? mapSize : 0]);
  useEffect(() => {
    markerRefs.current.forEach(({marker,indexes,name:label}) => {
      const name = t(label);
      marker.getElement().title = name;
      marker.getElement().setAttribute('aria-label', t('地图第{0}站 {1}', indexes.map(n=>n+1).join(' / '), name));
    });
    const labels = [
      ['.maplibregl-canvas', 'Map'],
      ['.maplibregl-ctrl-zoom-in', 'Zoom in'],
      ['.maplibregl-ctrl-zoom-out', 'Zoom out'],
      ['.maplibregl-ctrl-attrib-button', 'Toggle attribution'],
      ['.maplibregl-ctrl-attrib-inner', 'Map attribution']
    ];
    labels.forEach(([selector, label]) => {
      el.current?.querySelectorAll(selector).forEach(node => {
        node.setAttribute('aria-label', t(label));
        if (node.hasAttribute('title')) node.setAttribute('title', t(label));
      });
    });
  }, [language, ready, signature]);
  return <div className={'map-shell '+(expanded?'expanded-map':'')} data-route-legs={segments.length} data-visible-legs={segments.filter(s=>s.coordinates.length>1).length}><div className="map-canvas" ref={el}/>
   {(!ready||failed||!points.length)&&(expanded?<MapOverview points={points} segments={segments} selected={selected} onSelect={onSelect} failed={failed}/>:<div className="map-fallback"><div className="map-grid"/><span className="fallback-heading">{t(failed?'底图暂不可用':!located.length?'请结合官方导览寻找位置':'正在展开巴黎')}</span><div className="fallback-stations">{route.stops.map((s,i)=><button key={s.poi.id+'-'+i} onClick={()=>onSelect?.(i)} className={i===selected?'active':''}><b>{i+1}</b>{t(s.poi.name_zh)}</button>)}</div><small>{t('章节列表 · 非导航路径')}</small></div>)}
   {ready&&!failed&&points.length>0&&<button className="map-overview" aria-label={t('查看全部地点')} title={t('查看全部地点')} onClick={()=>{if(expanded)onClear?.();fit.current();}}><Maximize size={14}/><span>{t('查看全部地点')}</span></button>}
   {expanded&&located.length<route.stops.length&&<details className="unlocated-places"><summary>{t('{0} 个地点待定位',route.stops.length-located.length)}</summary><div><small>{t('尚无可靠坐标，按官方导览寻找。')}</small>{route.stops.map((s,i)=>!Number.isFinite(s.poi.coordinates?.lat)&&<button key={s.poi.id} onClick={e=>{e.currentTarget.closest('details').open=false;onSelect?.(i);}}><b>{i+1}</b>{t(s.poi.name_zh)}</button>)}</div></details>}
   <span className="map-label">{t(expanded?'按数字顺序游览':'地点分布 · 不代表连续步行路线')}{located.length<route.stops.length&&t(' · {0}处请看官方导览',route.stops.length-located.length)}</span>
  </div>;
}

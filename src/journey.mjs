import {decodeView,isGuidedStory} from './model.mjs';
export const JOURNEY_KEY='paris-storymap-journey-v1';
export function restoreJourney(raw,data){
 try{
  const value=JSON.parse(raw),route=data.routes.find(r=>r.persona_id===value?.route);
  if(!route)return null;
  return {route:route.persona_id,chapter:Math.max(0,Math.min(Number.isInteger(value.chapter)?value.chapter:0,route.stops.length-1))};
 }catch{return null;}
}
export function initialView(hash,journey,data){
 if(hash&&hash!=='#'&&hash!=='#/')return decodeView(hash,data);
 return journey?{type:'route',...journey}:{type:'quiz',stage:'questions',route:'NERD',chapter:0};
}
export function journeyFromView(view,previous,data){
 const route=data.routes.find(r=>r.persona_id===view.route);
 if(!route||!(view.type==='route'||isGuidedStory(view,route)))return previous;
 if(previous?.route===view.route&&previous?.chapter===(view.chapter||0))return previous;
 return {route:view.route,chapter:view.chapter||0};
}
export function nextUnreadChapter(route,reading={},from=0){
 for(let n=0;n<route.stops.length;n++){
  const index=(Math.max(0,from)+n)%route.stops.length;
  if(!['read','skipped'].includes(reading[route.stops[index].story_id]))return index;
 }
 return null;
}

import { it, expect } from 'vitest';
import { botanicalPalette, flowerTransition, updateBotanicalLayout, plantPose, plantAnchor, drawBotanicalBranch } from '../utils/botanicalVisuals.js';
const node = (id=1,type='note_loom') => ({id,type,x:0,y:0,audioParams:{scaleIndex:0},animationState:0});
it('interpolates the scale palette through the shortest hue path', () => {
  const n=node(), palette=h=>({baseHSL:{h,s:70,l:60},notes:[0,2,4,5,7,9,11]});
  expect(botanicalPalette(n,palette(350),0)).toBe('hsl(350 70% 60%)');
  const middle=Number(botanicalPalette(n,palette(10),.1).match(/hsl\(([^ ]+)/)[1]);
  expect(middle).toBeGreaterThan(350);expect(middle).toBeLessThan(370);
  expect(Number(botanicalPalette(n,palette(10),2).match(/hsl\(([^ ]+)/)[1])).toBeCloseTo(370,2);
});
it('eases note rotation and unfurls without changing the musical note', () => {
  const n=node(2,'sound');flowerTransition(n,0);n.audioParams.scaleIndex=7;
  const start=flowerTransition(n,0),middle=flowerTransition(n,.15),end=flowerTransition(n,2);
  expect(start.rotation).toBe(0);expect(middle.rotation).toBeGreaterThan(0);expect(middle.rotation).toBeLessThan(.84);
  expect(middle.unfurl).toBeGreaterThan(.5);expect(end.rotation).toBeCloseTo(.84,3);
  expect(n.audioParams.scaleIndex).toBe(7);
});
it('keeps growth deterministic and turns toward connected flowers in either cable direction', () => {
  const a=node(4),b=node(7),flower={...node(8,'sound'),x:100,y:0};
  updateBotanicalLayout([a,b,flower],[{nodeAId:4,nodeBId:8},{nodeAId:8,nodeBId:7}],0);
  expect(plantPose(a)).not.toBe(plantPose(b));
  const angle=plantPose(a);flower.x=-100;
  updateBotanicalLayout([a,b,flower],[{nodeAId:4,nodeBId:8}],.1);
  expect(Math.abs(plantPose(a)-angle)).toBeLessThan(Math.PI);
  expect(Math.hypot(plantAnchor(a,50).x,plantAnchor(a,50).y)).toBeLessThan(50);
});
it('draws a branch on the existing cable endpoints and leaves special cable types intact', () => {
  const moves=[],lines=[];
  const ctx=new Proxy({}, {get:(_,key)=>key==='moveTo'?(...p)=>moves.push(p):key==='lineTo'?(...p)=>lines.push(p):()=>{},set:()=>true});
  const a=node(),b=node(2,'sound'),start={x:2,y:3},end={x:30,y:45};
  expect(drawBotanicalBranch(ctx,a,b,{type:'standard'},start,end,1,{},false)).toBe(true);
  expect(moves[0]).toEqual([2,3]);expect(lines.at(-1)).toEqual([30,45]);
  expect(drawBotanicalBranch(ctx,a,b,{type:'glide'},start,end,1,{},false)).toBe(false);
});

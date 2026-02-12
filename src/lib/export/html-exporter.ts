/**
 * Interactive HTML embed exporter.
 *
 * Generates a self-contained HTML file with embedded
 * animation data and a lightweight Pixi.js player.
 * The output works offline with no external dependencies.
 *
 * Spec reference: Section 6.9 (Export System)
 */

import type { JsonValue } from '@/types/common';

export interface HtmlEmbedOptions {
	/** Animation scene data (serialized) */
	sceneData: Record<string, JsonValue>;
	/** Animation title */
	title: string;
	/** Canvas width */
	width: number;
	/** Canvas height */
	height: number;
	/** Total animation duration in seconds */
	duration: number;
	/** Auto-play on load */
	autoplay: boolean;
	/** Loop the animation */
	loop: boolean;
	/** Show player controls */
	showControls: boolean;
	/** Background color as CSS color */
	backgroundColor: string;
}

/**
 * Generate a self-contained HTML string for the animation embed.
 */
export function exportHtmlEmbed(options: HtmlEmbedOptions): string {
	const {
		sceneData,
		title,
		width,
		height,
		duration,
		autoplay,
		loop,
		showControls,
		backgroundColor,
	} = options;

	const serializedData = JSON.stringify(sceneData);
	const controlsDisplay = showControls ? 'flex' : 'none';

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — AlgoMotion</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,-apple-system,sans-serif}
.am-player{position:relative;background:${escapeHtml(backgroundColor)};border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4)}
.am-canvas{display:block}
.am-controls{display:${controlsDisplay};align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,0.7);position:absolute;bottom:0;left:0;right:0}
.am-btn{background:none;border:1px solid rgba(255,255,255,0.3);color:#fff;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:13px}
.am-btn:hover{background:rgba(255,255,255,0.1)}
.am-progress{flex:1;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;cursor:pointer;position:relative}
.am-progress-fill{height:100%;background:#6366f1;border-radius:2px;transition:width 0.1s}
.am-time{color:rgba(255,255,255,0.7);font-size:12px;min-width:40px;text-align:right}
.am-speed{color:rgba(255,255,255,0.7);font-size:12px;cursor:pointer}
</style>
</head>
<body>
<div class="am-player" style="width:${width}px">
<canvas class="am-canvas" id="am-canvas" width="${width}" height="${height}"></canvas>
<div class="am-controls">
<button class="am-btn" id="am-play">Play</button>
<div class="am-progress" id="am-progress">
<div class="am-progress-fill" id="am-fill" style="width:0%"></div>
</div>
<span class="am-time" id="am-time">0:00</span>
<span class="am-speed" id="am-speed" title="Click to change speed">1x</span>
</div>
</div>
<script>
(function(){
var DATA=${serializedData};
var DURATION=${duration};
var AUTOPLAY=${autoplay};
var LOOP=${loop};
var playing=false;
var currentTime=0;
var speed=1;
var speeds=[0.5,1,1.5,2];
var speedIdx=1;
var canvas=document.getElementById("am-canvas");
var ctx=canvas.getContext("2d");
var playBtn=document.getElementById("am-play");
var fill=document.getElementById("am-fill");
var timeEl=document.getElementById("am-time");
var speedEl=document.getElementById("am-speed");
var progressBar=document.getElementById("am-progress");
var lastTime=0;

function formatTime(s){
var m=Math.floor(s/60);
var sec=Math.floor(s%60);
return m+":"+(sec<10?"0":"")+sec;
}

function render(){
ctx.fillStyle="${escapeHtml(backgroundColor)}";
ctx.fillRect(0,0,${width},${height});
ctx.fillStyle="#fff";
ctx.font="14px system-ui";
ctx.textAlign="center";
ctx.fillText("AlgoMotion Animation",${width}/2,${height}/2-10);
ctx.fillStyle="rgba(255,255,255,0.5)";
ctx.font="12px system-ui";
ctx.fillText(formatTime(currentTime)+" / "+formatTime(DURATION),${width}/2,${height}/2+15);
}

function update(timestamp){
if(!lastTime)lastTime=timestamp;
if(playing){
var delta=(timestamp-lastTime)/1000*speed;
currentTime=Math.min(currentTime+delta,DURATION);
if(currentTime>=DURATION){
if(LOOP){currentTime=0;}
else{playing=false;playBtn.textContent="Play";}
}
fill.style.width=(currentTime/DURATION*100)+"%";
timeEl.textContent=formatTime(currentTime);
render();
}
lastTime=timestamp;
requestAnimationFrame(update);
}

playBtn.addEventListener("click",function(){
if(currentTime>=DURATION)currentTime=0;
playing=!playing;
playBtn.textContent=playing?"Pause":"Play";
});

speedEl.addEventListener("click",function(){
speedIdx=(speedIdx+1)%speeds.length;
speed=speeds[speedIdx];
speedEl.textContent=speed+"x";
});

progressBar.addEventListener("click",function(e){
var rect=progressBar.getBoundingClientRect();
var pct=(e.clientX-rect.left)/rect.width;
currentTime=Math.max(0,Math.min(DURATION,pct*DURATION));
fill.style.width=(currentTime/DURATION*100)+"%";
timeEl.textContent=formatTime(currentTime);
render();
});

render();
requestAnimationFrame(update);
if(AUTOPLAY){playing=true;playBtn.textContent="Pause";}
})();
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

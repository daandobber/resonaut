export const dailyTips = [
  "Use the brush tool to paint notes quickly.",
  "Hold Shift while dragging to disable snapping.",
  "Double-click a connection to edit its sound.",
  "Press G to toggle the grid.",
  "Try different scales for new atmospheres."
];

export function createDailyTipManager(el, prevBtn, nextBtn) {
  let index = 0;
  function show() {
    if (el) el.textContent = dailyTips[index];
  }
  function prev() {
    index = (index - 1 + dailyTips.length) % dailyTips.length;
    show();
  }
  function next() {
    index = (index + 1) % dailyTips.length;
    show();
  }
  function random() {
    index = Math.floor(Math.random() * dailyTips.length);
    show();
  }
  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);
  return { show, prev, next, random };
}

/* HORSEDAYS_MOMENTS_V11: own-horse tracking and one-time winning-jockey celebration.
 * No changes to race physics, race order, camera director, or save data.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HorseDaysRaceMoments = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  class Moments {
    constructor(random = Math.random) {
      this.random = random;
      this.ownerNumber = 0;
      this.firstWinnerNumber = 0;
      this.firstFinishAt = -1;
      this.winnerCelebrates = false;
      this.lastTime = -1;
    }
    reset() {
      this.ownerNumber = 0;
      this.firstWinnerNumber = 0;
      this.firstFinishAt = -1;
      this.winnerCelebrates = false;
      this.lastTime = -1;
    }
    update(time, rows, frame) {
      if (!frame || !rows || !rows.length) return;
      if (this.lastTime >= 0 && time < this.lastTime - 0.35) this.reset();
      this.lastTime = time;
      // The Unity race engine places the player's entered horse at runner index zero.
      // The draw order, rank, and barrier number can all change, so never assume horse number 1.
      const self = frame.runners && frame.runners.find(r => r.index === 0);
      this.ownerNumber = self ? self.number : 0;
      if (!this.firstWinnerNumber) {
        const winner = rows.find(r => r.finished && r.rank === 1) || rows.find(r => r.finished);
        if (winner) {
          this.firstWinnerNumber = winner.number;
          this.firstFinishAt = time;
          this.winnerCelebrates = this.random() < 0.38;
        }
      }
    }
    pose(number, time) {
      if (!this.winnerCelebrates || number !== this.firstWinnerNumber || this.firstFinishAt < 0) return 0;
      const dt = time - this.firstFinishAt;
      if (dt < 0 || dt >= 3.3) return 0;
      const up = clamp(dt / 0.33, 0, 1);
      const down = clamp((3.3 - dt) / 0.55, 0, 1);
      return up * up * (3 - 2 * up) * down * down * (3 - 2 * down);
    }
    drawOwner(ctx, rows, vp, rect, project) {
      if (!this.ownerNumber) return;
      const horse = rows.find(r => r.number === this.ownerNumber);
      if (!horse || horse.fallen) return;
      const q = project(vp, [horse.x, 2.95, horse.z], rect.width, rect.height);
      if (!Number.isFinite(q.x) || !Number.isFinite(q.y) || q.depth <= 0) return;
      const w = rect.width, h = rect.height;
      ctx.save();
      ctx.font = 'bold 13px system-ui,-apple-system,"Noto Sans JP",sans-serif';
      const maxName = horse.name && horse.name.length > 10 ? horse.name.slice(0, 10) + '…' : (horse.name || '');
      const label = '自分の馬  ' + horse.number + '番 ' + maxName + '  ' + horse.rank + '位';
      const boxWidth = Math.min(w - 20, Math.max(124, Math.ceil(ctx.measureText(label).width) + 23));
      const x = clamp(q.x, boxWidth / 2 + 10, w - boxWidth / 2 - 10);
      const y = clamp(q.y - 52, 52, h - 42);
      const left = x - boxWidth / 2;
      const offscreen = q.x < 0 || q.x > w || q.y < 0 || q.y > h;
      // A shadowed yellow pin stays legible over turf, dirt and similarly coloured silks.
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(12,24,16,.95)';
      ctx.fillStyle = 'rgba(255,231,57,.96)';
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 15); ctx.lineTo(x + 10, y + 15); ctx.lineTo(x, y + 31); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(16,33,23,.91)';
      ctx.fillRect(left, y - 14, boxWidth, 29);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffe739';
      ctx.strokeRect(left, y - 14, boxWidth, 29);
      ctx.fillStyle = '#ffe739';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(offscreen ? '◀ ' + label : label, x, y + 1, boxWidth - 10);
      ctx.restore();
    }
  }
  return {Moments};
});

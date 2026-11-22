// render.js — everything the eye sees, and nothing the game needs.
// The world is drawn in layers: floor and walls, loot and doors, cones,
// actors, smoke, then a darkness that leaves a pool of light around
// the thief, then the HUD on top (never darkened). Screens are drawn
// over a dimmed live room so the game is always visible behind them.

import { TILE, PALETTE, ALARM } from './config.js';
import { pathToPixels } from './routes.js';

export function computeView(canvas) {
  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.min(cw / (26 * TILE), ch / (16 * TILE));
  const w = 26 * TILE * scale;
  const h = 16 * TILE * scale;
  return { scale, ox: (cw - w) / 2, oy: (ch - h) / 2, w, h };
}

export function screenToWorld(view, x, y) {
  return { x: (x - view.ox) / view.scale, y: (y - view.oy) / view.scale };
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dark = document.createElement('canvas');
    this.time = 0;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.dark.width = this.canvas.width;
    this.dark.height = this.canvas.height;
  }

  draw(world, screen, plan, input) {
    const ctx = this.ctx;
    const view = computeView(this.canvas);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0710';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
    if (world) {
      this.drawFloor(world);
      this.drawDoors(world);
      this.drawLoot(world);
      this.drawLasers(world);
      this.drawTripwires(world);
      this.drawCones(world);
      this.drawActors(world);
      this.drawSmoke(world);
      if (plan) this.drawRoutes(world);
      this.drawDarkness(world, view);
    }
    // HUD and screens live in screen pixels, above the darkness.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (world) this.drawHud(world, view);
    if (screen === 'title') this.drawTitle(world);
    if (screen === 'levelComplete') this.drawLevelComplete(world);
    if (screen === 'caught') this.drawCaught(world);
    if (screen === 'won') this.drawWon(world);
  }

  drawFloor(world) {
    const ctx = this.ctx;
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const ch = world.tiles[y][x];
        const px = x * TILE;
        const py = y * TILE;
        if (ch === '#') {
          ctx.fillStyle = PALETTE.wall;
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = PALETTE.wallTop;
          ctx.fillRect(px, py, TILE, 4);
          ctx.fillStyle = 'rgba(201,162,39,0.25)';
          ctx.fillRect(px, py + TILE - 2, TILE, 2);
        } else {
          const checker = (x + y) % 2 === 0;
          ctx.fillStyle = ch === ',' ? PALETTE.floorShadow : (checker ? PALETTE.floorLight : PALETTE.floorDark);
          ctx.fillRect(px, py, TILE, TILE);
          if (ch === ',') {
            ctx.fillStyle = 'rgba(143,123,216,0.10)';
            ctx.fillRect(px, py, TILE, TILE);
          }
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(px, py + TILE - 1, TILE, 1);
          ctx.fillRect(px + TILE - 1, py, 1, TILE);
        }
        if (ch === 'H') {
          ctx.fillStyle = '#241428';
          ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
          ctx.fillStyle = '#3d1f33';
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#6f9e6a';
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2 - 4, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawDoors(world) {
    const ctx = this.ctx;
    const exit = world.exit;
    ctx.fillStyle = exit.open ? PALETTE.exit : '#8a2f2f';
    ctx.fillRect(exit.x - 14, exit.y - 14, 28, 28);
    ctx.fillStyle = '#0b0710';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(exit.open ? 'EXIT' : 'LOCK', exit.x, exit.y);
    if (exit.sealed) {
      ctx.fillStyle = 'rgba(255,64,48,0.85)';
      ctx.fillText('SEALED', exit.x, exit.y + 22);
    }
  }

  drawLoot(world) {
    const ctx = this.ctx;
    const pulse = 0.6 + 0.4 * Math.sin(this.time * 3);
    for (const item of world.loot) {
      if (item.taken) continue;
      const glow = 10 + 6 * pulse;
      ctx.fillStyle = 'rgba(255,217,74,0.25)';
      ctx.beginPath();
      ctx.arc(item.x, item.y, glow + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.lootGold;
      if (item.kind === 'o') {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a5c00';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', item.x, item.y);
      } else if (item.kind === 'g') {
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 8);
        ctx.lineTo(item.x + 7, item.y);
        ctx.lineTo(item.x, item.y + 8);
        ctx.lineTo(item.x - 7, item.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(item.x - 7, item.y - 7, 14, 14);
        ctx.fillStyle = '#7a5c00';
        ctx.fillRect(item.x - 3, item.y - 3, 6, 6);
      }
    }
    // The vault: a great golden door with a cracking dial.
    const v = world.vault;
    ctx.fillStyle = v.cracked ? '#8a6d1f' : PALETTE.lootGold;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#241a05';
    ctx.beginPath();
    ctx.arc(v.x, v.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.lootGold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 10, 0, Math.PI * 2 * (v.crackProgress / v.crackSeconds));
    ctx.stroke();
    ctx.fillStyle = PALETTE.lootGold;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v.cracked ? 'OPEN' : 'VAULT', v.x, v.y + 26);
  }

  drawLasers(world) {
    const ctx = this.ctx;
    for (const laser of world.lasers) {
      ctx.strokeStyle = laser.on ? 'rgba(255,48,48,0.9)' : 'rgba(255,48,48,0.18)';
      ctx.lineWidth = laser.on ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(laser.x0, laser.y);
      ctx.lineTo(laser.x1, laser.y);
      ctx.stroke();
      ctx.fillStyle = laser.on ? '#ff3030' : '#7a2020';
      ctx.fillRect(laser.x0 - 3, laser.y - 6, 6, 12);
      ctx.fillRect(laser.x1 - 3, laser.y - 6, 6, 12);
    }
  }

  drawTripwires(world) {
    const ctx = this.ctx;
    for (const wire of world.tripwires) {
      ctx.strokeStyle = wire.safe ? 'rgba(255,120,60,0.25)' : 'rgba(255,120,60,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wire.x - 14, wire.y);
      ctx.lineTo(wire.x + 14, wire.y);
      ctx.stroke();
      if (wire.tripped) {
        ctx.fillStyle = 'rgba(255,120,60,0.5)';
        ctx.beginPath();
        ctx.arc(wire.x, wire.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawCones(world) {
    const ctx = this.ctx;
    for (const camera of world.cameras) {
      const cone = camera.cone();
      if (cone) polygon(ctx, cone, PALETTE.coneCamera);
      ctx.fillStyle = camera.disabledLeft > 0 ? '#555' : '#c03030';
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd94a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(camera.x, camera.y);
      ctx.lineTo(camera.x + Math.cos(camera.facing) * 12, camera.y + Math.sin(camera.facing) * 12);
      ctx.stroke();
    }
    for (const guard of world.guards) {
      const alerted = guard.state === 'alert' || guard.state === 'suspicious';
      polygon(ctx, guard.cone(), alerted ? PALETTE.coneAlert : PALETTE.coneCalm);
    }
  }

  drawActors(world) {
    const ctx = this.ctx;
    for (const guard of world.guards) {
      ctx.fillStyle = guard.state === 'alert' ? '#ff2010' : PALETTE.guard;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0d12';
      ctx.beginPath();
      ctx.arc(guard.x + Math.cos(guard.facing) * 5, guard.y + Math.sin(guard.facing) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
      // Suspicion meter above the guard's head.
      if (guard.suspicion > 0.05) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(guard.x - 14, guard.y - 24, 28, 5);
        ctx.fillStyle = guard.suspicion >= 1 ? '#ff2010' : '#ffc442';
        ctx.fillRect(guard.x - 14, guard.y - 24, 28 * guard.suspicion, 5);
      }
      if (guard.state === 'alert' || guard.state === 'suspicious') {
        ctx.fillStyle = guard.state === 'alert' ? '#ff2010' : '#ffc442';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 28);
      }
    }
    // The thief: a pale figure in a dark coat, facing where they move.
    const t = world.thief;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#241a2e';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 11, Math.PI * 0.15, Math.PI * 0.85);
    ctx.fill();
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + Math.cos(t.facing) * 15, t.y + Math.sin(t.facing) * 15);
    ctx.stroke();
    if (t.sneaking) {
      ctx.fillStyle = '#8f7bd8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNEAK', t.x, t.y - 20);
    }
    for (const coin of world.tools.coins) {
      ctx.fillStyle = PALETTE.lootGold;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSmoke(world) {
    const ctx = this.ctx;
    for (const cloud of world.tools.smokeClouds) {
      ctx.fillStyle = `rgba(200,200,210,${0.25 + 0.1 * Math.sin(this.time * 5)})`;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 64, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawRoutes(world) {
    const ctx = this.ctx;
    const names = ['Grand Hall', 'Shadow Lane', 'Service Lane'];
    world.routes.forEach((route, i) => {
      const pts = pathToPixels(route.path);
      ctx.strokeStyle = route.color;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = route.color;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      const mid = pts[Math.floor(pts.length / 2)];
      ctx.fillText(route.name, mid[0] + 6, mid[1] - 6);
    });
    ctx.fillStyle = PALETTE.hud;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PLAN — three ways to the vault (hold TAB)', 12, 20);
  }

  drawDarkness(world, view) {
    const ctx = this.ctx;
    const dark = this.dark.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    dark.setTransform(1, 0, 0, 1, 0, 0);
    dark.clearRect(0, 0, w, h);
    dark.fillStyle = 'rgba(4,2,8,0.50)';
    dark.fillRect(0, 0, w, h);
    // Cut a pool of light around the thief, and smaller ones on loot.
    dark.globalCompositeOperation = 'destination-out';
    const tx = view.ox + world.thief.x * view.scale;
    const ty = view.oy + world.thief.y * view.scale;
    const grad = dark.createRadialGradient(tx, ty, 20, tx, ty, 175 * view.scale);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.75)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    dark.fillStyle = grad;
    dark.beginPath();
    dark.arc(tx, ty, 175 * view.scale, 0, Math.PI * 2);
    dark.fill();
    for (const item of world.loot) {
      if (item.taken) continue;
      const lx = view.ox + item.x * view.scale;
      const ly = view.oy + item.y * view.scale;
      const g2 = dark.createRadialGradient(lx, ly, 2, lx, ly, 46 * view.scale);
      g2.addColorStop(0, 'rgba(0,0,0,0.85)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      dark.fillStyle = g2;
      dark.beginPath();
      dark.arc(lx, ly, 46 * view.scale, 0, Math.PI * 2);
      dark.fill();
    }
    dark.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.dark, 0, 0);
  }

  drawHud(world, view) {
    const ctx = this.ctx;
    const pad = 12;
    const scale = Math.min(view.w / (26 * TILE), 1.4);
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(scale, scale);
    // Top bar: level, alarm meter, loot, score, time.
    ctx.fillStyle = 'rgba(8,4,12,0.82)';
    ctx.fillRect(0, 0, 26 * TILE, 44);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${world.levelIndex + 1}/5  ${world.level.name}`, pad, 22);
    // Alarm meter: the big one, centre top, always visible.
    const mx = 26 * TILE / 2 - 130;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mx, 12, 260, 20);
    const alarmColor = world.alarm.value >= ALARM.stageLockdown ? '#ff2010'
      : world.alarm.value >= ALARM.stageAlert ? '#ff8c1a' : '#ffc442';
    ctx.fillStyle = alarmColor;
    ctx.fillRect(mx + 2, 14, 256 * world.alarm.fill, 16);
    ctx.strokeStyle = '#f2ead8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mx, 12, 260, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ALARM ${Math.round(world.alarm.value)}%`, mx + 130, 22);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.lootGold;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`$${world.lootValue}  •  ${world.score} pts`, 26 * TILE - pad, 22);
    // Tools row, bottom left.
    const counts = world.tools.counts;
    ctx.textAlign = 'left';
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(8,4,12,0.82)';
    ctx.fillRect(0, 16 * TILE - 34, 430, 34);
    ctx.fillStyle = PALETTE.hud;
    ctx.fillText(`[1] Coin lure ×${counts.coin}    [2] Smoke ×${counts.smoke}    [3] EMP ×${counts.emp}    [Shift] Sneak    [TAB] Plan    Click: throw coin`, pad, 16 * TILE - 17);
    // Vault status + timer, bottom right.
    ctx.textAlign = 'right';
    const vaultText = world.vault.cracked ? 'VAULT CRACKED — reach the EXIT' : 'Crack the VAULT, then reach the EXIT';
    ctx.fillStyle = world.vault.cracked ? PALETTE.exit : PALETTE.lootGold;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${vaultText}   •   ${Math.floor(world.elapsed)}s`, 26 * TILE - pad, 16 * TILE - 17);
    ctx.restore();
    this.drawMinimap(world, view);
  }

  drawMinimap(world, view) {
    const ctx = this.ctx;
    const mw = 150;
    const mh = 92;
    // Below the top bar, so it never covers the score or the alarm meter.
    const mx = view.ox + view.w - mw - 10;
    const my = view.oy + 44 * view.scale + 8;
    const sx = mw / (world.width * TILE);
    const sy = mh / (world.height * TILE);
    ctx.fillStyle = 'rgba(8,4,12,0.85)';
    ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
    ctx.strokeStyle = PALETTE.goldTrim;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 4, my - 4, mw + 8, mh + 8);
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const ch = world.tiles[y][x];
        if (ch === '#') ctx.fillStyle = '#3a2f45';
        else if (ch === ',') ctx.fillStyle = '#4a3f66';
        else continue;
        ctx.fillRect(mx + x * TILE * sx, my + y * TILE * sy, TILE * sx + 0.5, TILE * sy + 0.5);
      }
    }
    for (const item of world.loot) {
      if (item.taken) continue;
      ctx.fillStyle = PALETTE.lootGold;
      ctx.fillRect(mx + item.x * sx - 2, my + item.y * sy - 2, 4, 4);
    }
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(mx + world.vault.x * sx, my + world.vault.y * sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.exit;
    ctx.fillRect(mx + world.exit.x * sx - 3, my + world.exit.y * sy - 3, 6, 6);
    for (const guard of world.guards) {
      ctx.fillStyle = guard.state === 'alert' ? '#ff2010' : '#ff8a7a';
      ctx.beginPath();
      ctx.arc(mx + guard.x * sx, my + guard.y * sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(mx + world.thief.x * sx, my + world.thief.y * sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  dimScreen(alpha = 0.72) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(6,3,10,${alpha})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  panelTitle(text, sub) {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText(text, cx, this.canvas.height * 0.3);
    ctx.fillStyle = '#f2ead8';
    ctx.font = '20px Georgia, serif';
    ctx.fillText(sub, cx, this.canvas.height * 0.3 + 40);
  }

  drawTitle(world) {
    this.dimScreen(0.55);
    this.panelTitle('THE VERMILION VAULT', 'A stealth heist in five rooms — cross unseen, crack the vault, slip out.');
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const y0 = this.canvas.height * 0.3 + 90;
    ctx.fillStyle = '#cfc4ae';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    const lines = [
      'WASD / Arrows — move      Shift — sneak (slower, harder to see)',
      'Click — throw a coin to lure a guard      2 — smoke      3 — EMP the cameras',
      'Hold TAB — study the three routes to the vault',
      'Guards patrol, cameras sweep, lasers blink. Read the cones before you move.',
      '',
      'Press ENTER or click to begin the heist',
    ];
    lines.forEach((line, i) => ctx.fillText(line, cx, y0 + i * 28));
    ctx.fillStyle = '#8f7bd8';
    ctx.font = '15px sans-serif';
    ctx.fillText('Tip: shadow floor hides you — a guard’s cone fills half as fast in the dark.', cx, y0 + lines.length * 28 + 10);
  }

  drawLevelComplete(world) {
    this.dimScreen();
    const r = world.levelResult;
    this.panelTitle('CLEAN GETAWAY', `${world.level.name} — the vault is empty and you are gone.`);
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const y0 = this.canvas.height * 0.3 + 90;
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('★'.repeat(r.stars) + '☆'.repeat(3 - r.stars), cx, y0);
    ctx.fillStyle = '#f2ead8';
    ctx.font = '18px sans-serif';
    const lines = [
      `Loot lifted: $${r.lootValue}`,
      `Vault bonus: +${500}    Ghost bonus: +${r.ghostBonus}    Quiet bonus: +${r.quietBonus}`,
      `Time bonus: +${r.timeBonus}  (${Math.floor(r.elapsed)}s)`,
      `Level score: ${r.levelScore}    Total: ${world.score}`,
      '',
      'Press ENTER for the next room',
    ];
    lines.forEach((line, i) => ctx.fillText(line, cx, y0 + 50 + i * 30));
  }

  drawCaught(world) {
    this.dimScreen();
    this.panelTitle('CAUGHT', world.caughtReason);
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const y0 = this.canvas.height * 0.3 + 100;
    ctx.fillStyle = '#f2ead8';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    const lines = [
      'The guards saw you coming — the cone was on you, and the warning was the “!” above their head.',
      'Watch the patrol, wait for the cone to pass, and use the shadow lane next time.',
      '',
      `Score kept: ${world.score}    •    Press R to try the room again`,
    ];
    lines.forEach((line, i) => ctx.fillText(line, cx, y0 + i * 30));
  }

  drawWon(world) {
    this.dimScreen(0.6);
    this.panelTitle('THE VERMILION STAR IS YOURS', 'Five rooms, five vaults, one clean getaway.');
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const y0 = this.canvas.height * 0.3 + 100;
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('★★★', cx, y0);
    ctx.fillStyle = '#f2ead8';
    ctx.font = '19px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Final score: ${world.score}    •    Loot lifted: $${world.lootValue}`, cx, y0 + 50);
    ctx.fillText('Press ENTER to run the heist again, from the lobby.', cx, y0 + 90);
  }
}

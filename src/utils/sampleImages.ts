/**
 * Generates synthetic realistic Bet261 Instant League 8035 match screenshot
 * for instant testing and demonstration of the OCR module.
 */
export function generateSampleBet261Screenshot(
  homeTeam: string,
  awayTeam: string,
  o1: number,
  ox: number,
  o2: number,
  matchId: string = '#8035-04',
  time: string = '16:45',
  homeRank: number = 1,
  awayRank: number = 3
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 680;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, 360);
  grad.addColorStop(0, '#0c1322');
  grad.addColorStop(1, '#070a12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 680, 360);

  // Top header bar
  ctx.fillStyle = '#162238';
  ctx.fillRect(0, 0, 680, 52);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 50, 680, 2);

  // Brand Bet261 & League badge
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.fillText('BET261 VIRTUAL SPORTS', 24, 32);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText('INSTANT LEAGUE • ID: 8035', 380, 32);

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(630, 26, 5, 0, Math.PI * 2);
  ctx.fill();

  // Match info bar
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(`Match ${matchId}  •  Coup d'envoi: ${time}`, 24, 90);

  // Teams Card container
  ctx.fillStyle = '#111c2e';
  ctx.strokeStyle = '#1e2e4a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(24, 108, 632, 130, 10);
  ctx.fill();
  ctx.stroke();

  // Home Team
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.fillText(homeTeam, 44, 160);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(`Rang: ${homeRank}e  •  Forme: V-V-N-V`, 44, 190);

  // VS Badge
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText('VS', 315, 172);

  // Away Team
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(awayTeam, 636, 160);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(`Rang: ${awayRank}e  •  Forme: V-D-V-N`, 636, 190);
  ctx.textAlign = 'left';

  // Odds section
  const oddsY = 256;
  const colWidth = 200;
  const gap = 16;

  const oddsBoxes = [
    { label: '1 (Domicile)', val: o1.toFixed(2), x: 24, bg: '#13213a', border: '#1e3a5f' },
    { label: 'X (Nul)', val: ox.toFixed(2), x: 24 + colWidth + gap, bg: '#13213a', border: '#1e3a5f' },
    { label: '2 (Extérieur)', val: o2.toFixed(2), x: 24 + (colWidth + gap) * 2, bg: '#13213a', border: '#1e3a5f' }
  ];

  oddsBoxes.forEach((b) => {
    ctx.fillStyle = b.bg;
    ctx.strokeStyle = b.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(b.x, oddsY, colWidth, 76, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText(b.label, b.x + 16, oddsY + 28);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px Inter, monospace';
    ctx.fillText(b.val, b.x + 16, oddsY + 60);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}

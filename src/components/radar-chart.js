export function renderRadarChart(canvasId, dimensions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const width = rect.width;
  const height = rect.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 30; // margin for text
  
  const labels = ['音韵', '字形', '意境', '风骨', '实用'];
  const data = [
    dimensions.sound.score, 
    dimensions.shape.score, 
    dimensions.style.score, 
    dimensions.classic.score, 
    dimensions.practical.score
  ];
  
  const angleStep = (Math.PI * 2) / labels.length;

  ctx.clearRect(0, 0, width, height);

  // Background Concentric Pentagons
  const levels = 4;
  for (let level = 1; level <= levels; level++) {
    const r = radius * (level / levels);
    ctx.beginPath();
    for (let i = 0; i < labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#E2E8F0'; 
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axes & Labels
  for (let i = 0; i < labels.length; i++) {
    const angle = i * angleStep - Math.PI / 2;
    // Axis line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const endX = cx + radius * Math.cos(angle);
    const endY = cy + radius * Math.sin(angle);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Text
    const textR = radius + 15;
    const textX = cx + textR * Math.cos(angle);
    const textY = cy + textR * Math.sin(angle);
    
    ctx.font = '12px Noto Sans SC';
    ctx.fillStyle = '#A0AEC0'; // --color-yanhui
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], textX, textY - 6);
    ctx.fillStyle = '#4A5568'; // --color-dai
    ctx.fillText(data[i], textX, textY + 8);
  }

  // Value Polygon
  ctx.beginPath();
  for (let i = 0; i < labels.length; i++) {
    const val = data[i] / 20; 
    const angle = i * angleStep - Math.PI / 2;
    const targetR = radius * val;
    const ptX = cx + targetR * Math.cos(angle);
    const ptY = cy + targetR * Math.sin(angle);

    if (i === 0) ctx.moveTo(ptX, ptY);
    else ctx.lineTo(ptX, ptY);
  }
  ctx.closePath();
  
  // Fill & Stroke
  ctx.fillStyle = 'rgba(196, 168, 130, 0.2)'; // semi-transparent ouhe
  ctx.fill();
  ctx.strokeStyle = '#C4A882'; // --color-ouhe
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

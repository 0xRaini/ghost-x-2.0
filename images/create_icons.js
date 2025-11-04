// Ghost X 图标生成器
// 这个脚本会生成不同尺寸的PNG图标

const fs = require('fs');
const { createCanvas } = require('canvas');

function createGhostIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1DA1F2');
    gradient.addColorStop(1, '#1991db');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // 圆角
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // 幽灵主体
    ctx.fillStyle = 'white';
    ctx.beginPath();
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    
    // 幽灵形状
    ctx.arc(centerX, centerY - size * 0.1, radius, Math.PI, 0, false);
    ctx.lineTo(centerX + radius, centerY + size * 0.2);
    
    // 底部波浪
    for (let i = 0; i < 3; i++) {
        const x = centerX + radius - (i * size * 0.15);
        const y = centerY + size * 0.2;
        ctx.quadraticCurveTo(x - size * 0.05, y + size * 0.1, x - size * 0.1, y);
    }
    
    ctx.lineTo(centerX - radius, centerY + size * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#1DA1F2';
    ctx.beginPath();
    ctx.arc(centerX - size * 0.15, centerY - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX + size * 0.15, centerY - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // 嘴巴
    ctx.strokeStyle = '#1DA1F2';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.arc(centerX, centerY + size * 0.05, size * 0.1, 0, Math.PI);
    ctx.stroke();
    
    return canvas.toBuffer('image/png');
}

// 生成不同尺寸的图标
const sizes = [16, 48, 128];

sizes.forEach(size => {
    const icon = createGhostIcon(size);
    fs.writeFileSync(`icon${size}.png`, icon);
    console.log(`Generated icon${size}.png`);
});

console.log('All icons generated successfully!');

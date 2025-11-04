# Ghost X 扩展图标

## 图标说明

Ghost X 扩展需要一个幽灵主题的图标，设计风格与Twitter/X保持一致。

## 图标规格

- **16x16**: 浏览器工具栏图标
- **48x48**: 扩展管理页面图标  
- **128x128**: Chrome商店图标

## 生成图标

### 方法1: 使用图标生成器

1. 打开 `icon_generator.html` 文件
2. 在浏览器中查看生成的图标预览
3. 点击"下载"按钮保存对应的PNG文件
4. 确保文件名正确：`icon16.png`, `icon48.png`, `icon128.png`

### 方法2: 使用简单图标生成器

1. 打开 `create_simple_icons.html` 文件
2. 右键点击图标选择"图片另存为"
3. 保存为对应的文件名

### 方法3: 使用Python脚本（需要PIL）

```bash
pip install Pillow
python3 create_icons.py
```

## 图标设计

图标采用以下设计元素：
- **背景**: Twitter蓝色渐变 (#1DA1F2 到 #1991db)
- **主体**: 白色幽灵形状
- **眼睛**: 蓝色圆点
- **嘴巴**: 蓝色弧形线条
- **风格**: 简洁、现代、符合Twitter设计语言

## 文件结构

```
images/
├── icon16.png          # 16x16 图标
├── icon48.png          # 48x48 图标
├── icon128.png         # 128x128 图标
├── icon.svg            # SVG源文件
├── icon_generator.html # 图标生成器
├── create_simple_icons.html # 简单图标生成器
├── create_icons.py     # Python图标生成脚本
└── README.md           # 本文件
```

## 注意事项

1. 确保图标文件保存在 `images/` 目录中
2. 文件名必须与manifest.json中的配置一致
3. 图标应该是PNG格式，支持透明背景
4. 图标应该在不同尺寸下都清晰可见

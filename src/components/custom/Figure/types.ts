export interface FigureProps {
  id: string; // 图片唯一标识
  src: string; // 图片路径
  title: string; // 图片标题/说明（原caption）
  width?: string; // 新增：宽度配置，可选
}

export interface FigureRefProps {
  id: string; // 引用的图片ID
}

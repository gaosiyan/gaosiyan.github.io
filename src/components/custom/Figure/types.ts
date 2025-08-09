// 仅保留必要的属性定义
export interface FigureProps {
  id: string; // 锚点ID
  src: string; // 图片路径
  title: string; // 显示的标题（替代caption）
}

export interface FigureRefProps {
  id: string; // 引用的图片ID
}

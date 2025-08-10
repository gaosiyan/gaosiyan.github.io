import type { ReactNode } from "react";

export interface FigureProps {
  src: string; // 图片路径（必选）
  title: ReactNode; // 支持 React节点(含公式)（必选）
  id?: string; // 锚点参数 (可选,默认值 title)
  width?: string; // 宽度设置 (可选,默认值 80%)
}

export interface FigureRefProps {
  id?: string; // 对应Figure的id或title
}

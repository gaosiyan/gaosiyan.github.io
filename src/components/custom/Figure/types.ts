import type { ReactNode } from "react"; // 新增导入

export interface FigureProps {
  id: string; // 图片唯一标识
  src: string; // 图片路径
  title: ReactNode; // 支持React节点（含公式）
  width?: string; // 宽度配置，可选
}

export interface FigureRefProps {
  id: string; // 引用的图片ID
}

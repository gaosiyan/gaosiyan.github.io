// Table/types.ts
import type { ReactNode } from "react";

export interface TableProps {
  title: ReactNode; // 支持 React节点(含公式)（必选）
  id?: string; // 锚点参数 (可选,默认值自动生成)
  children: ReactNode; // 表格内容（必选）
  width?: string; // 宽度设置 (可选,默认值 80%)
}

export interface TableRefProps {
  id?: string; // 对应Table的id
}
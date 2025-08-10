export interface TableProps {
  /** 表格标题 */
  title?: React.ReactNode;
  /** 表格唯一标识（用于引用） */
  id?: string;
  /** 表格宽度 */
  width?: string | number;
  /** 表头水平对齐方式 */
  headerAlign?: "left" | "center" | "right";
  /** 表头垂直对齐方式 */
  headerVerticalAlign?: "top" | "middle" | "bottom";
  /** 单元格水平对齐方式 */
  cellAlign?: "left" | "center" | "right";
  /** 单元格垂直对齐方式 */
  cellVerticalAlign?: "top" | "middle" | "bottom";
  /** 是否启用筛选功能 */
  enableFilter?: boolean;
  /** 表格内容（Markdown格式） */
  children?: React.ReactNode;
}

export interface TableRefProps {
  /** 要引用的表格ID */
  id: string;
}

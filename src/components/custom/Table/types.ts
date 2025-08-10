export interface TableCell {
  content: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  className?: string;
}

export interface TableRow {
  cells: TableCell[];
  className?: string;
  id?: string;
}

export interface TableProps {
  title?: string;
  id?: string; // 新增表格ID，用于锚点和编号
  headers?: TableCell[];
  rows: TableRow[];
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  numbered?: boolean; // 新增：是否显示编号
}

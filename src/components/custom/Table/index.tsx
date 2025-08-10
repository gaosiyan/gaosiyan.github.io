import React, { ReactNode } from "react";
import styles from "./styles.module.css";

// 生成唯一的表格 ID
const getTableKey = (id?: string, title?: ReactNode): string => {
  if (id) return id;
  if (typeof title === "string") return title;
  return `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Table 组件
const Table: React.FC<TableProps> = ({ title, id, children }) => {
  const tableKey = getTableKey(id, title);
  const anchorId = `table-${tableKey}`;

  return (
    <div className={styles.tableContainer} id={anchorId}>
      {title && <div className={styles.tableTitle}>{title}</div>}
      <div className="markdown-table">{children}</div>
    </div>
  );
};

// TableRef 组件
const TableRef: React.FC<TableRefProps> = ({ id }) => {
  const anchorId = `#table-${id}`;
  return (
    <a href={anchorId} className={styles.tableRef}>
      {`表格 ${id}`}
    </a>
  );
};

// 默认导出 Table 组件
export default Table;

// Table 类型定义
export interface TableProps {
  title: React.ReactNode;
  id?: string;
  children: ReactNode;
}

export interface TableRefProps {
  id: string;
}

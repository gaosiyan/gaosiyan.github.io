import React from "react";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table";
import styles from "./styles.module.css";
import { TableCell, TableRow, TableProps } from "./types";

// 存储所有表格ID和编号的映射
const tableMap: Record<string, number> = {};
let tableCounter = 0;

const Table: React.FC<TableProps> = ({
  title,
  id,
  headers = [],
  rows,
  className = "",
  headerClassName = "",
  rowClassName = "",
  cellClassName = "",
  numbered = true, // 默认显示编号
}) => {
  // 为每个表格ID分配唯一的编号
  if (id && !tableMap[id]) {
    tableCounter++;
    tableMap[id] = tableCounter;
  }

  const tableNumber = id ? tableMap[id] : undefined;

  // 转换 headers 为 TanStack Table 需要的格式
  const columns = React.useMemo(() => {
    return headers.map((header, idx) => ({
      accessorKey: `col_${idx}`,
      header: header.content,
      size: 100,
    }));
  }, [headers]);

  // 转换 rows 为 TanStack Table 需要的格式
  const data = React.useMemo(() => {
    return rows.map((row) => {
      const rowData: Record<string, React.ReactNode> = {};
      row.cells.forEach((cell, cellIdx) => {
        rowData[`col_${cellIdx}`] = cell.content;
      });
      return rowData;
    });
  }, [rows]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 渲染单元格
  const renderCell = (cell: TableCell, rowIdx: number, colIdx: number) => {
    if (cell.colSpan === 0 || cell.rowSpan === 0) return null;

    const align = cell.align ?? "center";
    const valign = cell.valign ?? "middle";
    const alignClass =
      styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`];
    const valignClass =
      styles[`valign${valign.charAt(0).toUpperCase() + valign.slice(1)}`];

    return (
      <td
        key={`${rowIdx}-${colIdx}`}
        rowSpan={cell.rowSpan}
        colSpan={cell.colSpan}
        className={`${styles.cell} ${cellClassName} ${alignClass} ${valignClass} ${cell.className || ""}`}>
        {cell.content}
      </td>
    );
  };

  return (
    <div className={styles.tableContainer} id={id ? `table-${id}` : undefined}>
      <table className={`${styles.table} ${className}`}>
        {/* 有表头时才渲染 thead */}
        {headers.length > 0 && (
          <thead className={`${styles.header} ${headerClassName}`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => {
                  const h = headers[idx];
                  const align = h?.align ?? "center";
                  const valign = h?.valign ?? "middle";
                  return (
                    <th
                      key={header.id}
                      colSpan={h?.colSpan}
                      rowSpan={h?.rowSpan}
                      className={`${styles.cell} ${cellClassName} ${
                        styles[
                          `align${align.charAt(0).toUpperCase() + align.slice(1)}`
                        ]
                      } ${
                        styles[
                          `valign${valign.charAt(0).toUpperCase() + valign.slice(1)}`
                        ]
                      } ${h?.className || ""}`}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`${rowClassName} ${row.className || ""}`}
              id={row.id}>
              {row.cells.map((cell, colIdx) =>
                renderCell(cell, rowIdx, colIdx),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {/* 显示带编号的标题 - 冒号后添加空格 */}
      {title && (
        <div className={styles.tableTitle}>
          {numbered && tableNumber && `表-${tableNumber}: `}
          {title}
        </div>
      )}
    </div>
  );
};

// 创建表格引用组件 - 前后添加空格
interface TableRefProps {
  id: string;
}

export const TableRef: React.FC<TableRefProps> = ({ id }) => {
  const tableNumber = tableMap[id];

  return tableNumber ? (
    <a href={`#table-${id}`} className={styles.tableRef}>
      {" "}
      表-{tableNumber}{" "}
    </a>
  ) : null;
};

export default Table;

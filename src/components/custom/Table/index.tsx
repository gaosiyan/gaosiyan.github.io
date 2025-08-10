import React, { ReactNode, useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { TableProps, TableRefProps } from "./types";
import { useMDXComponents } from "@mdx-js/react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// 导入@tanstack/react-table 8.21.3核心模块
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
} from "@tanstack/react-table";

// 定义表格单元格数据类型
interface TableCell {
  content: string;
  rowSpan: number;
  colSpan: number;
}

// 定义表格行数据类型
interface TableRowData {
  [key: string]: TableCell | undefined;
}

// 全局状态管理（用于表格编号）
const globalState = {
  tableMap: {} as Record<string, Record<string, number>>,
  counters: {} as Record<string, number>,
  listeners: new Set<() => void>(),

  registerTable(path: string, key: string): number {
    if (!this.tableMap[path]) {
      this.tableMap[path] = {};
      this.counters[path] = 0;
    }

    if (this.tableMap[path][key] !== undefined) {
      return this.tableMap[path][key];
    }

    const newCounter = (this.counters[path] || 0) + 1;
    this.counters[path] = newCounter;
    this.tableMap[path][key] = newCounter;
    this.listeners.forEach((listener) => listener());
    return newCounter;
  },

  addListener(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

// 生成表格唯一标识
const getTableKey = (id?: string, title?: ReactNode): string => {
  if (id) return id;
  if (typeof title === "string")
    return title.replace(/\s+/g, "-").toLowerCase();
  return `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 渲染带数学公式的内容
const renderContent = async (content: string): Promise<ReactNode> => {
  try {
    const code = await compile(content, {
      outputFormat: "function-body",
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    });
    const { default: Component } = await run(code, {
      ...runtime,
      useMDXComponents,
    });
    return <Component />;
  } catch (error) {
    console.error("Error rendering content with math:", error);
    return content;
  }
};

// 解析Markdown表格内容
const parseMarkdownTable = (content: string) => {
  const cleanedContent = content.trim();
  const lines = cleanedContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  if (lines.length === 0) return { headers: [], data: [] };

  // 检测表头分隔线
  const headerSeparatorIndex = lines.findIndex((line) =>
    /^\|?\s*:?---+:?\s*(\|?\s*:?---+:?\s*)*\|?$/.test(line),
  );

  let headers: string[] = [];
  let data: string[][] = [];

  if (headerSeparatorIndex > -1) {
    // 有表头表格
    headers = lines[headerSeparatorIndex - 1]
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell !== "");

    data = lines.slice(headerSeparatorIndex + 1).map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter(
          (cell, index, arr) => !(index === 0 && cell === "" && arr.length > 1),
        ),
    );
  } else {
    // 无表头表格
    headers = [];
    data = lines.map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter(
          (cell, index, arr) => !(index === 0 && cell === "" && arr.length > 1),
        ),
    );
  }

  return { headers, data };
};

// 处理单元格合并（^n行合并，>n列合并）
const processCellMerges = (data: string[][]) => {
  const mergedData = [...data.map((row) => [...row])];
  const mergeInfo = {
    rowSpan: Array.from({ length: data.length }, () =>
      Array(data[0]?.length || 0).fill(1),
    ),
    colSpan: Array.from({ length: data.length }, () =>
      Array(data[0]?.length || 0).fill(1),
    ),
  };

  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < (data[i]?.length || 0); j++) {
      if (!mergedData[i] || mergedData[i][j] === "") continue;

      // 行合并处理（^2表示合并2行）
      const rowMergeMatch = mergedData[i][j].match(/\^(\d+)/);
      if (rowMergeMatch) {
        const span = parseInt(rowMergeMatch[1], 10);
        mergeInfo.rowSpan[i][j] = span;
        mergedData[i][j] = mergedData[i][j].replace(/\^(\d+)/, "").trim();

        // 标记被合并的单元格
        for (let k = 1; k < span; k++) {
          if (i + k < data.length && j < (data[i + k]?.length || 0)) {
            mergedData[i + k][j] = "";
          }
        }
      }

      // 列合并处理（>2表示合并2列）
      const colMergeMatch = mergedData[i][j].match(/>(\d+)/);
      if (colMergeMatch) {
        const span = parseInt(colMergeMatch[1], 10);
        mergeInfo.colSpan[i][j] = span;
        mergedData[i][j] = mergedData[i][j].replace(/>(\d+)/, "").trim();

        // 标记被合并的单元格
        for (let k = 1; k < span; k++) {
          if (j + k < (data[i]?.length || 0)) {
            mergedData[i][j + k] = "";
          }
        }
      }
    }
  }

  return { mergedData, mergeInfo };
};

// 公式单元格组件
const MathCell: React.FC<{ content: string }> = ({ content }) => {
  const [renderedContent, setRenderedContent] = useState<ReactNode>(content);

  useEffect(() => {
    const loadContent = async () => {
      const rendered = await renderContent(content);
      setRenderedContent(rendered);
    };
    loadContent();
  }, [content]);

  return <>{renderedContent}</>;
};

export const Table: React.FC<TableProps> = ({
  title,
  id,
  width = "80%",
  headerAlign = "center",
  headerVerticalAlign = "middle",
  cellAlign = "center",
  cellVerticalAlign = "middle",
  enableFilter = false,
  children,
}) => {
  const [titleContent, setTitleContent] = useState<ReactNode>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [tableData, setTableData] = useState<TableRowData[]>([]);
  const [columns, setColumns] = useState<ColumnDef<TableRowData>[]>([]);
  const [filterText, setFilterText] = useState("");
  const tableKey = getTableKey(id, title);
  const [tableNumber, setTableNumber] = useState(0);
  const mergeInfoRef = useRef({
    rowSpan: [] as number[][],
    colSpan: [] as number[][],
  });
  const [headerElements, setHeaderElements] = useState<ReactNode[]>([]);

  // 计算筛选后的数据（自定义实现，不依赖表格内置方法）
  const getFilteredData = (data: TableRowData[], filter: string) => {
    if (!filter) return data;

    return data.filter((row) => {
      return Object.values(row).some((cell) => {
        if (!cell) return false;
        return cell.content.toLowerCase().includes(filter.toLowerCase());
      });
    });
  };

  // 获取当前页面路径
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // 渲染标题（支持数学公式）
  useEffect(() => {
    const loadTitle = async () => {
      if (typeof title === "string") {
        const content = await renderContent(title);
        setTitleContent(content);
      } else {
        setTitleContent(title);
      }
    };
    loadTitle();
  }, [title]);

  // 解析表格内容并生成列定义
  useEffect(() => {
    if (typeof children === "string") {
      const { headers, data: markdownData } = parseMarkdownTable(children);
      const { mergedData, mergeInfo } = processCellMerges(markdownData);
      mergeInfoRef.current = mergeInfo;

      // 预渲染表头元素
      const renderHeaders = async () => {
        const elements: ReactNode[] = [];
        for (const header of headers) {
          elements.push(await renderContent(header));
        }
        setHeaderElements(elements);
      };
      renderHeaders();

      // 生成列定义（使用自定义渲染逻辑）
      let tableColumns: ColumnDef<TableRowData>[] = [];

      if (headers.length > 0) {
        // 有表头表格
        tableColumns = headers.map((_, index) => {
          const columnId = `col${index}`;
          return {
            id: columnId,
            header: () => headerElements[index] || null,
            cell: ({ row }) => {
              const cellData = row.original[columnId];
              return cellData ? <MathCell content={cellData.content} /> : null;
            },
          };
        });
      } else {
        // 无表头表格
        const columnCount = mergedData[0]?.length || 0;
        tableColumns = Array.from({ length: columnCount }, (_, index) => {
          const columnId = `col${index}`;
          return {
            id: columnId,
            header: () => null,
            cell: ({ row }) => {
              const cellData = row.original[columnId];
              return cellData ? <MathCell content={cellData.content} /> : null;
            },
          };
        });
      }

      // 格式化表格数据
      const formattedData: TableRowData[] = mergedData.map((row, rowIndex) => {
        const rowData: TableRowData = {};
        if (row) {
          row.forEach((cell, colIndex) => {
            if (cell !== "") {
              const columnId = `col${colIndex}`;
              rowData[columnId] = {
                content: cell,
                rowSpan: mergeInfo.rowSpan[rowIndex]?.[colIndex] || 1,
                colSpan: mergeInfo.colSpan[rowIndex]?.[colIndex] || 1,
              };
            }
          });
        }
        return rowData;
      });

      setColumns(tableColumns);
      setTableData(formattedData);
    }
  }, [children, headerElements]);

  // 注册表格并更新编号
  useEffect(() => {
    if (currentPath) {
      const num = globalState.registerTable(currentPath, tableKey);
      setTableNumber(num);
    }
  }, [currentPath, tableKey]);

  // 初始化表格（最小化配置，避免API冲突）
  const table = useReactTable({
    data: enableFilter ? getFilteredData(tableData, filterText) : tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 处理筛选输入
  const handleFilterChange = (value: string) => {
    setFilterText(value);
  };

  const anchorId = `table-${tableKey}`;

  return (
    <div className={styles.tableContainer} id={anchorId} style={{ width }}>
      {/* 表格标题 */}
      <div className={styles.title}>
        表 {tableNumber}: {titleContent || title}
      </div>

      {/* 筛选输入框 */}
      {enableFilter && (
        <input
          type="text"
          value={filterText}
          onChange={(e) => handleFilterChange(e.target.value)}
          placeholder="筛选表格内容..."
          className={styles.filterInput}
        />
      )}

      {/* 表格容器 */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          {/* 表头 - 使用自定义渲染的表头元素 */}
          {columns.length > 0 && headerElements.length > 0 && (
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.id}
                    style={{
                      textAlign: headerAlign,
                      verticalAlign: headerVerticalAlign,
                    }}>
                    {headerElements[index]}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* 表体 - 直接使用数据渲染，避免使用renderCell */}
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const cellData = row.original[cell.column.id];
                  if (!cellData || cellData.content === "") return null;

                  return (
                    <td
                      key={cell.id}
                      rowSpan={cellData.rowSpan || 1}
                      colSpan={cellData.colSpan || 1}
                      style={{
                        textAlign: cellAlign,
                        verticalAlign: cellVerticalAlign,
                      }}>
                      <MathCell content={cellData.content} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 表格引用组件
export const TableRef: React.FC<TableRefProps> = ({ id }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [tableNumber, setTableNumber] = useState<number | undefined>(undefined);
  const tableKey = id || "";
  const isMounted = useRef(false);

  // 获取当前页面路径
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // 监听表格编号变化
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    }

    const updateNumber = () => {
      if (currentPath && globalState.tableMap[currentPath]) {
        setTableNumber(globalState.tableMap[currentPath][tableKey]);
      }
    };

    updateNumber();
    const unsubscribe = globalState.addListener(updateNumber);
    return unsubscribe;
  }, [currentPath, tableKey]);

  return tableNumber ? (
    <a href={`#table-${tableKey}`} className={styles.tableRef}>
      表 {tableNumber}
    </a>
  ) : null;
};

export default Table;

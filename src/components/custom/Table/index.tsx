// Table/index.tsx
import React, { ReactNode, useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { TableProps, TableRefProps } from "./types";
import { useMDXComponents } from "@mdx-js/react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// 全局状态管理（表格编号相关）
const globalState = {
  tableMap: {} as Record<string, Record<string, number>>,
  counters: {} as Record<string, number>,
  listeners: new Set<() => void>(),

  // 注册表格并生成编号
  registerTable(path: string, key: string) {
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

    // 通知所有监听器更新
    this.listeners.forEach((listener) => listener());
    return newCounter;
  },

  // 添加状态更新监听
  addListener(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

// 生成表格唯一标识符
const getTableKey = (id?: string, title?: ReactNode): string => {
  if (id) return id;
  if (typeof title === "string") return title;
  return `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 渲染标题（支持公式）
const renderTitle = async (title: ReactNode) => {
  if (typeof title === "string") {
    const code = await compile(title, {
      outputFormat: "function-body",
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    });
    const { default: Component } = await run(code, {
      ...runtime,
      useMDXComponents,
    });
    return <Component />;
  }
  return title;
};

export const Table: React.FC<TableProps> = ({
  title,
  id,
  children,
  width = "80%",
}) => {
  const [titleContent, setTitleContent] = useState<ReactNode>(null);
  const [currentPath, setCurrentPath] = useState("");
  const tableKey = getTableKey(id, title);
  const [tableNumber, setTableNumber] = useState(0);

  // 获取当前页面路径
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // 渲染标题（支持公式）
  useEffect(() => {
    const loadTitle = async () => {
      const content = await renderTitle(title);
      setTitleContent(content);
    };
    loadTitle();
  }, [title]);

  // 注册表格并更新编号
  useEffect(() => {
    if (currentPath) {
      const num = globalState.registerTable(currentPath, tableKey);
      setTableNumber(num);
    }
  }, [currentPath, tableKey]);

  const anchorId = `table-${tableKey}`;

  return (
    <div className={styles.tableContainer} id={anchorId} style={{ width }}>
      {/* 直接渲染子元素，不添加额外样式包装 */}
      {children}
      <div className={styles.title}>
        表 {tableNumber}: {titleContent || title}
      </div>
    </div>
  );
};

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

  // 监听全局状态变化，更新引用编号
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

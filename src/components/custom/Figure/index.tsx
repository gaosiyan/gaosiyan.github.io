import React, { ReactNode, useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { FigureProps, FigureRefProps } from "./types";
import { useMDXComponents } from "@mdx-js/react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// 全局状态管理（使用闭包+ref保存，避免组件重渲染丢失状态）
const globalState = {
  figureMap: {} as Record<string, Record<string, number>>,
  counters: {} as Record<string, number>,
  listeners: new Set<() => void>(), // 状态更新监听器

  // 注册图表并触发更新
  registerFigure(path: string, key: string) {
    if (!this.figureMap[path]) {
      this.figureMap[path] = {};
      this.counters[path] = 0;
    }

    if (this.figureMap[path][key] !== undefined) {
      return this.figureMap[path][key];
    }

    const newCounter = (this.counters[path] || 0) + 1;
    this.counters[path] = newCounter;
    this.figureMap[path][key] = newCounter;

    // 通知所有监听器状态更新
    this.listeners.forEach((listener) => listener());
    return newCounter;
  },

  // 添加状态更新监听
  addListener(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener); // 返回取消监听函数
  },
};

// 生成唯一标识符：优先使用id，否则使用title字符串化
const getFigureKey = (id?: string, title?: ReactNode): string => {
  if (id) return id;
  if (typeof title === "string") return title;
  return `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

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

export const Figure: React.FC<FigureProps> = ({
  src,
  title,
  id,
  width = "80%",
}) => {
  const [titleContent, setTitleContent] = useState<ReactNode>(null);
  const [currentPath, setCurrentPath] = useState("");
  const figureKey = getFigureKey(id, title);
  const [figureNumber, setFigureNumber] = useState(0);

  // 获取当前页面路径
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // 渲染标题
  useEffect(() => {
    const loadTitle = async () => {
      const content = await renderTitle(title);
      setTitleContent(content);
    };
    loadTitle();
  }, [title]);

  // 注册图表并更新编号
  useEffect(() => {
    if (currentPath) {
      const num = globalState.registerFigure(currentPath, figureKey);
      setFigureNumber(num);
    }
  }, [currentPath, figureKey]);

  const anchorId = `fig-${figureKey}`;

  return (
    <div className={styles.figureContainer} id={anchorId} style={{ width }}>
      <img
        src={src}
        alt={typeof title === "string" ? title : undefined}
        className={styles.image}
      />
      <div className={styles.title}>
        图 {figureNumber}: {titleContent || title}
      </div>
    </div>
  );
};

export const FigureRef: React.FC<FigureRefProps> = ({ id }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [figureNumber, setFigureNumber] = useState<number | undefined>(
    undefined,
  );
  const figureKey = id || "";
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

    // 同步当前编号
    const updateNumber = () => {
      if (currentPath && globalState.figureMap[currentPath]) {
        setFigureNumber(globalState.figureMap[currentPath][figureKey]);
      }
    };

    // 初始同步
    updateNumber();
    // 监听状态变化
    const unsubscribe = globalState.addListener(updateNumber);

    return unsubscribe;
  }, [currentPath, figureKey]);

  return figureNumber ? (
    <a href={`#fig-${figureKey}`} className={styles.figureRef}>
      图 {figureNumber}
    </a>
  ) : null;
};

export default Figure;

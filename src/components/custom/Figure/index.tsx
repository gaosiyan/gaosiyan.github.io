import React, { ReactNode } from "react";
import styles from "./styles.module.css";
import { FigureProps, FigureRefProps } from "./types";
import { useMDXComponents } from "@mdx-js/react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// 改为按页面路径存储计数器，实现文档隔离
const figureMap: Record<string, Record<string, number>> = {};
const counters: Record<string, number> = {};

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
  const [titleContent, setTitleContent] = React.useState<ReactNode>(null);
  const [currentPath, setCurrentPath] = React.useState("");

  // 获取当前页面路径作为文档唯一标识
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  React.useEffect(() => {
    const loadTitle = async () => {
      const content = await renderTitle(title);
      setTitleContent(content);
    };
    loadTitle();
  }, [title]);

  // 初始化当前文档的计数器
  if (currentPath && !figureMap[currentPath]) {
    figureMap[currentPath] = {};
    counters[currentPath] = 0;
  }

  // 生成当前图的唯一键
  const figureKey = getFigureKey(id, title);

  // 分配编号
  if (currentPath && !figureMap[currentPath][figureKey]) {
    counters[currentPath]++;
    figureMap[currentPath][figureKey] = counters[currentPath];
  }

  const figureNumber = currentPath ? figureMap[currentPath][figureKey] : 0;
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
  const [currentPath, setCurrentPath] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  const figureKey = id || "";
  const figureNumber =
    currentPath && figureMap[currentPath]
      ? figureMap[currentPath][figureKey]
      : undefined;

  return figureNumber ? (
    <a href={`#fig-${figureKey}`} className={styles.figureRef}>
      图 {figureNumber}
    </a>
  ) : null;
};

export default Figure;

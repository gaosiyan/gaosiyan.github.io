import React from "react";
import styles from "./styles.module.css";
import { FigureProps, FigureRefProps } from "./types";
import { useMDXComponents } from "@mdx-js/react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkMath from "remark-math"; // 引入数学公式插件
import rehypeKatex from "rehype-katex"; // 引入KaTeX渲染插件

// 全局变量用于跟踪图片编号
const figureMap: Record<string, number> = {};
let counter = 0;

// 使用MDX解析标题中的公式（带数学插件）
const renderTitle = async (title: React.ReactNode) => {
  if (typeof title === "string") {
    // 编译MDX内容时显式应用数学公式插件
    const code = await compile(title, {
      outputFormat: "function-body",
      remarkPlugins: [remarkMath], // 启用数学公式解析
      rehypePlugins: [rehypeKatex], // 启用KaTeX渲染
    });
    // 运行编译后的代码
    const { default: Component } = await run(code, {
      ...runtime,
      useMDXComponents,
    });
    return <Component />;
  }
  return title;
};

export const Figure: React.FC<FigureProps> = ({
  id,
  src,
  title,
  width = "80%",
}) => {
  const [titleContent, setTitleContent] = React.useState<React.ReactNode>(null);

  // 处理异步解析
  React.useEffect(() => {
    const loadTitle = async () => {
      const content = await renderTitle(title);
      setTitleContent(content);
    };
    loadTitle();
  }, [title]);

  if (!figureMap[id]) {
    counter++;
    figureMap[id] = counter;
  }
  const figureNumber = figureMap[id];

  return (
    <div className={styles.figureContainer} id={`fig-${id}`} style={{ width }}>
      <img
        src={src}
        alt={typeof title === "string" ? title : undefined}
        className={styles.image}
      />
      <div className={styles.title}>
        图{figureNumber}: {titleContent || title}
      </div>
    </div>
  );
};

export const FigureRef: React.FC<FigureRefProps> = ({ id }) => {
  const figureNumber = figureMap[id];

  return figureNumber ? (
    <a href={`#fig-${id}`} className={styles.figureRef}>
      图{figureNumber}
    </a>
  ) : null;
};

export default Figure;

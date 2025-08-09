import React from "react";
import styles from "./styles.module.css";
import { FigureProps, FigureRefProps } from "./types";
import { useMDXComponents } from "@mdx-js/react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const figureMap: Record<string, number> = {};
let counter = 0;

const renderTitle = async (title: React.ReactNode) => {
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
  id,
  src,
  title,
  width = "80%",
}) => {
  const [titleContent, setTitleContent] = React.useState<React.ReactNode>(null);

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
      {/* 保持标题容器类名，通过CSS深度控制 */}
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

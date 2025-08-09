import React from "react";
import styles from "./styles.module.css";
import { FigureProps, FigureRefProps } from "./types";

// 全局变量用于跟踪图片编号
const figureMap: Record<string, number> = {};
let counter = 0;

export const Figure: React.FC<FigureProps> = ({
  id,
  src,
  title,
  width = "80%", // 设置默认宽度为80%
}) => {
  // 为新图片分配编号
  if (!figureMap[id]) {
    counter++;
    figureMap[id] = counter;
  }
  const figureNumber = figureMap[id];

  return (
    <div
      className={styles.figureContainer}
      id={`fig-${id}`}
      style={{ width }} // 应用宽度配置
    >
      <img src={src} alt={title} className={styles.image} />
      <div className={styles.title}>
        图{figureNumber}: {title}
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

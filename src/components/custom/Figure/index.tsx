import React from "react";
import styles from "./styles.module.css";
import { FigureProps, FigureRefProps } from "./types";

// 编号管理（与Table组件逻辑一致）
const figureMap: Record<string, number> = {};
let counter = 0;

export const Figure: React.FC<FigureProps> = ({ id, src, title }) => {
  // 自动分配唯一编号
  if (!figureMap[id]) {
    counter++;
    figureMap[id] = counter;
  }
  const figureNumber = figureMap[id];

  return (
    <div className={styles.figureContainer} id={`fig-${id}`}>
      <img
        src={src}
        alt={title} // 用title作为替代文本，确保无障碍支持
        className={styles.image}
      />
      <div className={styles.caption}>
        图{figureNumber}: {title}
      </div>
    </div>
  );
};

export const FigureRef: React.FC<FigureRefProps> = ({ id }) => {
  const figureNumber = figureMap[id];

  return figureNumber ? (
    <a href={`#fig-${id}`} className={styles.figRef}>
      图{figureNumber}
    </a>
  ) : null;
};

export default Figure;

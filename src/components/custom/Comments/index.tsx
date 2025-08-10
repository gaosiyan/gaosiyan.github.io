import React from "react";
import Giscus, { GiscusProps } from "@giscus/react";
import { useColorMode } from "@docusaurus/theme-common";

const Comments: React.FC = () => {
  const { colorMode } = useColorMode();

  // 根据Docusaurus主题设置giscus主题
  const theme: GiscusProps["theme"] = colorMode === "dark" ? "dark" : "light";

  return (
    <div className="giscus-comments mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
      <Giscus
        repo="gaosiyan/Discussions"
        repoId="R_kgDOPbjS8g"
        category="Announcements" // 替换为你的分类名，如"Comments"
        categoryId="DIC_kwDOPbjS8s4CuAmL" // 替换为你的分类ID
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={theme}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
};

export default Comments;

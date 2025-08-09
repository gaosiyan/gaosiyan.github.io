# -*- coding: utf-8 -*-
# pylint: disable=invalid-name
# pylint 不检查命名风格

"""
文件名称: formater.py
文件作者: gaozhan
创建时间: 2025/08/09
功能说明: md & mdx 源文件格式化
后续优化: 
    1. 多线程并行.
    2. 封装 GUI.
"""

import os
import re
import time
from pathlib import Path
from hashlib import sha1


class Formatter:
    """md & mdx 源文件格式化 文件格式化"""

    def __init__(self, root_dir: str) -> None:
        """
        root_dir: 文件目录
        """
        img_dir = os.path.join(root_dir, "static//img/content")

        if os.path.isdir(img_dir) is False:
            raise FormatterError(f"{img_dir} 目录不存在")

        temp_dir = os.path.join(root_dir, "temp")
        if os.path.isdir(temp_dir) is False:
            raise FormatterError(f"{temp_dir} 目录不存在")

        # 获取 md 和 mdx 文件列表
        md_file_list: list[str] = []
        for root, _, files in os.walk(root_dir):
            for file in files:
                if file.endswith(".md") or file.endswith(".mdx"):
                    md_file_list.append(os.path.join(root, file))

        self.temp_dir: str = temp_dir
        self.img_dir: str = img_dir
        self.md_file_list = md_file_list

        # 切换成英文标点,并删除冗余的空格和换行
        self.cn_en_format()

        # 获取附件文件列表
        img_file_list: list[str] = []
        for img in os.listdir(img_dir):
            if img != ".gitignore":
                img_file_list.append(os.path.join(img_dir, img))
        self.img_file_list: list[str] = img_file_list

        self.md_file_list: list[str] = md_file_list
        self.ref_img_file_list: list[str] = self.get_ref_img_file_list()

        # 如果附件丢失不进行后续处理
        if len(self.ref_img_file_list) > len(self.img_file_list):
            raise FormatterError(f"附件文件有丢失,引用 {len(self.ref_img_file_list)} 个附件,实际存在 {len(self.img_file_list)} 个附件")

    def run(self):
        """运行格式化"""
        # 删除冗余文件,同时也修正 self.img_file_list        
        self.del_img()

        # 按照哈希号重命名附件文件
        self.rename_img_file()

        
        for md_file in self.md_file_list:
            os.system(f'{os.path.dirname(os.path.abspath(__file__))}/mdfmt/mdfmt -w "{md_file}"')

    def get_ref_img_file_list(self) -> list[str]:
        """返回所有引用的附件列表"""
        ref_img_file_list: list[str] = []
        for md_file_list in self.md_file_list:
            ref_img_file_list.extend(re.findall(r"/img/content/([^/\s]*\.[^/\s]*)['\"]", self.get_text_file_content(md_file_list)))

        ref_img_file_list = list(set(ref_img_file_list))
        print(f"共引用 {len(ref_img_file_list)} 个附件")
        return ref_img_file_list

    def del_img(self) -> None:
        """删除冗余文件"""
        del_file_list: list[str] = []
        for img_file in self.img_file_list:
            img_file_name = os.path.basename(img_file)
            find_flag: bool = False
            for ref_img_file in self.ref_img_file_list:
                ref_img_name = os.path.basename(ref_img_file)
                if ref_img_name == img_file_name:
                    find_flag = True
                    break

            if find_flag is False:
                dst_file = os.path.join(self.temp_dir, img_file_name)

                while True:
                    if os.path.exists(dst_file) is False:
                        break
                    dst_file = dst_file + "_"

                os.rename(img_file, dst_file)
                del_file_list.append(img_file)

        for del_file in del_file_list:
            if del_file in self.img_file_list:
                self.img_file_list.remove(del_file)

        print(f"共移除 {len(del_file_list)} 个文件")

    def rename_img_file(self):
        """重命名并更新源文件"""
        for img_file in self.img_file_list:
            sha1_code = sha1(self.get_bin_file_content(img_file)).hexdigest()
            if sha1_code != os.path.splitext(os.path.basename(img_file))[0]:
                old_name = os.path.basename(img_file)
                new_name = sha1_code + os.path.splitext(os.path.basename(img_file))[1]
                os.rename(img_file, os.path.join(os.path.dirname(img_file), new_name))
                for md_file in self.md_file_list:
                    write_flag = False
                    old_content = self.get_text_file_content(md_file)
                    if len(re.findall(rf"/img/content/{old_name}", old_content)) != 0:
                        new_content = re.sub(
                            rf"/img/content/{old_name}",
                            rf"/img/content/{new_name}",
                            old_content,
                        )
                        write_flag = True
                    if write_flag:
                        self.write_text_file(md_file, new_content)
                        print(f"更新 {os.path.basename(md_file)} 文件")

    def cn_en_format(self) -> None:
        """格式化"""
        for md_file in self.md_file_list:
            # 替换标点符号
            content = self.get_text_file_content(md_file)
            content = (
                content.replace("。", ".")
                .replace("，", ",")
                .replace("（", "(")
                .replace("）", ")")
                .replace("、", ",")
                .replace("！", "!")
                .replace("：", ":")
                .replace('“', '"')
                .replace('”', '"')
                .replace("；", ";")
                .replace("？", "?")
            )

            # 去除中文之间的多余空格
            content = re.sub(r"([\u4e00-\u9fa5]) +([\u4e00-\u9fa5])", r"\1\2", content)
            # 去除英文之间的多余空格
            content = re.sub(r"\b([a-zA-Z]) +([a-zA-Z])\b", r"\1 \2", content)
            # 中英文之间添加一个空格
            content = re.sub(r"([\u4e00-\u9fa5]) *([a-zA-Z])", r"\1 \2", content)
            content = re.sub(r"([a-zA-Z]) *([\u4e00-\u9fa5])", r"\1 \2", content)
            # 中文数字之间添加一个空格
            content = re.sub(r"([\u4e00-\u9fa5]) *(\d+)", r"\1 \2", content)
            content = re.sub(r"(\d+) *([\u4e00-\u9fa5])", r"\1 \2", content)
            # 删除多余的换行
            content = re.sub(r"\n\n+", r"\n\n", content)

            # 回写文件
            self.write_text_file(md_file, content.strip() + os.linesep)



    def get_text_file_content(self, file_path) -> str:
        """text 文件读取"""
        read_flag = False
        with open(file_path, mode="r", encoding="utf-8") as file:
            content = file.read()
            read_flag = True

        if read_flag is False:
            raise FormatterError(f"{file_path} 读取失败,文件不存在,或者非 UTF-8 编码")

        return content

    def get_bin_file_content(self, file_path) -> bytes:
        """bin 文件读取"""
        read_flag = False
        with open(file_path, mode="rb") as file:
            content = file.read()
            read_flag = True

        if read_flag is False:
            raise FormatterError(f"{file_path} 读取失败,文件不存在")
        return content

    def write_text_file(self, file_path, content: str) -> None:
        """text 文件写入"""
        write_flag = False
        with open(file_path, mode="w", encoding="utf-8") as file:
            file.write(content)
            write_flag = True

        if write_flag is False:
            raise FormatterError(f"{file_path} 写入失败,文件不存在")


class FormatterError(Exception):
    """自定义异常
    raise FormatterError(e)
    """



if __name__ == "__main__":
    start_time = time.time()
    Formatter(Path(__file__).resolve().parent.parent).run()
    end_time = time.time()
    elapsed_time = end_time - start_time
    print(f"耗时 {elapsed_time:.2f} 秒")

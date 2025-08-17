import os
import traceback
from typing import TypedDict
from graphviz import Digraph

# 36.211 Table 4.2-2
TDD_FRAME_CONFIG_SET = [
    "DSUUUDSUUU",  # 配比 0
    "DSUUDDSUUD",  # 配比 1
    "DSUDDDSUDD",  # 配比 2
    "DSUUUDDDDD",  # 配比 3
    "DSUUDDDDDD",  # 配比 4
    "DSUDDDDDDD",  # 配比 5
    "DSUUUDSUUD",  # 配比 6
]


# 36.213 Table 10.1.3.1-1 [配置][子帧号] -> K
TDD_HARQ_DL_ASSOCIATION_SET = [
    [[], [], [6], [], [4], [], [], [6], [], [4]],  # 配比 0
    [[], [], [7, 6], [4], [], [], [], [7, 6], [4], []],  # 配比 1
    [[], [], [8, 7, 4, 6], [], [], [], [], [8, 7, 4, 6], [], []],  # 配比 2
    [[], [], [7, 6, 11], [6, 5], [5, 4], [], [], [], [], []],  # 配比 3
    [[], [], [12, 8, 7, 11], [6, 5, 4, 7], [], [], [], [], [], []],  # 配比 4
    [[], [], [13, 12, 9, 8, 7, 5, 4, 11, 6], [], [], [], [], [], [], []],  # 配比 5
    [[], [], [7], [7], [5], [], [], [7], [7], []],  # 配比 6
]

UPLINK_SUBFRAME_SYMBOL = "🔺"
DOWNLINK_SUBFRAME_SYMBOL = "🔽"
SPECIAL_SUBFRAME_SYMBOL = "🔄"

COLOR = ["blue", "red", "green", "orange", "darkviolet"]


class SubfrmInfo(TypedDict):
    subfrm_type: str  # 子帧类型 ->"D","S","U"
    symbol: str  # 子帧符号 DOWNLINK_SUBFRAME_SYMBOL,SPECIAL_SUBFRAME_SYMBOL,UPLINK_SUBFRAME_SYMBOL
    K: list  # 上行子帧有效,K 列表
    M: int  # 上行子帧有效,M 个数
    pdsch_subfrm_set: list[int]  # 上行子帧有效,当前反馈窗内的下行子帧集合
    n: int  # 下行子帧有效,当前 PDSCH HARQ-ACK 的反馈子帧
    m: int  # 下行子帧有效,m 值,当前子帧在反馈窗中的索引,即 k_0 中的下标


def calc_subfrm_info(tdd_config: int, subfrm: int):
    if tdd_config not in range(7):
        raise ValueError(f"tdd_config: {tdd_config} 为异常值! \n调用栈:\n {traceback.format_stack()}")

    if subfrm not in range(10):
        raise ValueError(f"subfrm: {subfrm} 为异常值! \n调用栈:\n {traceback.format_stack()}")

    subfrm_info = SubfrmInfo()

    subfrm_type = TDD_FRAME_CONFIG_SET[tdd_config][subfrm]

    subfrm_info["subfrm_type"] = subfrm_type
    if subfrm_type == "D":
        subfrm_info["symbol"] = DOWNLINK_SUBFRAME_SYMBOL
    elif subfrm_type == "U":
        subfrm_info["symbol"] = UPLINK_SUBFRAME_SYMBOL
    else:
        subfrm_info["symbol"] = SPECIAL_SUBFRAME_SYMBOL

    if subfrm_type == "U":
        subfrm_info["K"] = TDD_HARQ_DL_ASSOCIATION_SET[tdd_config][subfrm]
        subfrm_info["M"] = len(subfrm_info["K"])
        subfrm_info["pdsch_subfrm_set"] = []
        for k in subfrm_info["K"]:
            subfrm_info["pdsch_subfrm_set"].append(((subfrm + 10) - k) % 10)
    else:
        find_flag = False
        for n in range(subfrm + 1, subfrm + 10):
            n = n % 10
            if TDD_FRAME_CONFIG_SET[tdd_config][n] == "U":
                K_list = TDD_HARQ_DL_ASSOCIATION_SET[tdd_config][n]
                for m, k in enumerate(K_list):
                    if ((n + 10) - k) % 10 == subfrm:
                        subfrm_info["m"] = m
                        subfrm_info["n"] = n
                        find_flag = True
                        break
        if find_flag is False:
            raise ValueError(f"tdd_config: {tdd_config} subfrm: {subfrm} 未找到下行相关信息! \n调用栈:\n {traceback.format_stack()}")
    return subfrm_info


def create_tdd_diagram(tdd_config: int):

    subfrm_info_list = []
    for subfrm in range(10):
        subfrm_info_list.append(calc_subfrm_info(tdd_config, subfrm))

    label = ""

    for index in range(9, 30):
        subfrm = index % 10
        subfrm_info = subfrm_info_list[subfrm]
        subfrm_type = subfrm_info["subfrm_type"]
        symbol = subfrm_info["symbol"]

        first_line = f"<S{index}> {subfrm_type}{subfrm} {symbol}"  # <S0> D0

        if subfrm_type == "U":
            K = subfrm_info["K"]
            M = subfrm_info["M"]
            pdsch_subfrm_set = subfrm_info["pdsch_subfrm_set"]
            second_line = f"M = {M}"
            third_line = f"K = {K}"
            fourth_line = f"{pdsch_subfrm_set}"
        else:
            n = subfrm_info["n"]
            K = subfrm_info_list[n]["K"]
            m = subfrm_info["m"]
            second_line = f"m = {m}"
            third_line = f"k_{m} = {K[m]}"
            fourth_line = f"{n}"

        if index == 29:
            separator = ""
        else:
            separator = "|"

        first_line = first_line.strip() + "\\n"
        second_line = second_line.strip() + "\\n"
        third_line = third_line.strip() + "\\n"
        fourth_line = fourth_line.strip() + separator

        label = label + first_line + second_line + third_line + fourth_line

    dot = Digraph(f"TDD_CONFIG{tdd_config}", format="svg")
    dot.attr(rankdir="TB")  # 从左到右布局

    # 设置全局属性
    dot.attr("node", fontname="Microsoft YaHei", fontsize="20", shape="record")
    dot.attr("edge", fontname="Microsoft YaHei", fontsize="20", minlen="2", style="solid", arrowsize="0.8", penwidth="2")

    dot.node("subfrm", label=label)

    color_index = 0
    line_style = "solid"

    for subfrm in range(10):
        subfrm_info = subfrm_info_list[subfrm]
        if subfrm_info["subfrm_type"] == "U":
            end_point = f"subfrm:S{subfrm+20}:n"
            for k in subfrm_info["K"]:
                pdsch_frame = subfrm + 20 - k
                start_point = f"subfrm:S{pdsch_frame}:n"
                dot.edge(start_point, end_point, style=line_style, color=COLOR[color_index % len(COLOR)])

            if color_index % 1 == 0:
                line_style = "dashed"
            else:
                line_style = "solid"

            color_index = color_index + 1

    print(dot.source)
    output_filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"{tdd_config}")
    dot.render(filename=output_filename, cleanup=True, format="svg")


for tdd_config in range(7):
    create_tdd_diagram(tdd_config)

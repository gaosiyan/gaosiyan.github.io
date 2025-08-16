
# 36.211 Table 4.2-2
TddFrameConfig = [
    "DSUUUDSUUU",  # 配比 0
    "DSUUDDSUUD",  # 配比 1
    "DSUDDDSUDD",  # 配比 2
    "DSUUUDDDDD",  # 配比 3
    "DSUUDDDDDD",  # 配比 4
    "DSUDDDDDDD",  # 配比 5
    "DSUUUDSUUD",  # 配比 6
]




dot = graphviz.Digraph(comment="The Round Table")

print(dot.source)

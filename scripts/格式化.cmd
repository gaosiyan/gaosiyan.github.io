@echo off
:: 保存初始目录（当前执行脚本时的目录）
set "INIT_DIR=%cd%"

:: 获取脚本所在目录（%~dp0 表示当前脚本的目录路径，含末尾反斜杠）
set "SCRIPT_DIR=%~dp0"

:: 切换到脚本所在目录
cd /d "%SCRIPT_DIR%"

call prettier.cmd

cd /d "%SCRIPT_DIR%"

set path=D:\bin\anaconda3;D:\bin\anaconda3\Library\mingw-w64\bin;D:\bin\anaconda3\Library\usr\bin;D:\bin\anaconda3\Library\bin;D:\bin\anaconda3\Scripts;D:\bin\anaconda3\bin;D:\bin\anaconda3\condabin;%path%
python formatter.py
echo SUCCESS
cd /d "%INIT_DIR%"
pause

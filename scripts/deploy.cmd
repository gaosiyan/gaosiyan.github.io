@echo off
set /p commit_msg=请输入提交日志:
:: 保存初始目录（当前执行脚本时的目录）
set "INIT_DIR=%cd%"

:: 获取脚本所在目录（%~dp0 表示当前脚本的目录路径，含末尾反斜杠）
set "SCRIPT_DIR=%~dp0"

:: 切换到脚本所在目录
cd /d "%SCRIPT_DIR%"
call 格式化.cmd

cd /d  "%SCRIPT_DIR%" 
cd ..

git add . && git commit -m "%commit_msg%" && git push -u origin master && npm run deploy

cd /d  "%INIT_DIR%"

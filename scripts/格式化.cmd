@echo off
:: 保存初始目录（当前执行脚本时的目录）
set "INIT_DIR=%cd%"

:: 获取脚本所在目录（%~dp0 表示当前脚本的目录路径，含末尾反斜杠）
set "SCRIPT_DIR=%~dp0"

:: 切换到脚本所在目录
cd /d "%SCRIPT_DIR%"

:: 执行 prettier 并检查错误
call prettier.cmd
if %errorlevel% neq 0 (
    echo ERROR: prettier.cmd 执行失败
    cd /d "%INIT_DIR%"
    pause
    exit /b %errorlevel%
)

cd /d "%SCRIPT_DIR%"

:: 设置环境变量并执行 Python 脚本
set path=D:\bin\anaconda3;D:\bin\anaconda3\Library\mingw-w64\bin;D:\bin\anaconda3\Library\usr\bin;D:\bin\anaconda3\Library\bin;D:\bin\anaconda3\Scripts;D:\bin\anaconda3\bin;D:\bin\anaconda3\condabin;%path%
python formatter.py
if %errorlevel% neq 0 (
    echo ERROR: formatter.py 执行失败
    cd /d "%INIT_DIR%"
    pause
    exit /b %errorlevel%
)

echo SUCCESS
echo 将在5秒后自动退出...
timeout /t 5 /nobreak >nul
cd /d "%INIT_DIR%"
:: 等待后退出
exit /b 0

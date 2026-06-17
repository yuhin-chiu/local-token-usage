@echo off
REM Stop the ai-usage dashboard (whatever is listening on port 3002).
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3002" ^| findstr LISTENING') do (
  echo Stopping PID %%p ...
  taskkill /PID %%p /F
)
echo Done.

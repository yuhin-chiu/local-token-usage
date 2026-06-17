' Launch the ai-usage dashboard (Next.js prod server) fully hidden, no console window.
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "D:\projects\ai-usage"
cmd = """C:\Program Files\nodejs\node.exe"" ""D:\projects\ai-usage\node_modules\next\dist\bin\next"" start -p 3002"
' 0 = hidden window, False = don't wait
sh.Run cmd, 0, False

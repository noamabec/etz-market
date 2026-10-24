@echo off
start "" http://localhost:8821/
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Root "%~dp0." -Port 8821

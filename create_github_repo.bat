@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM  create_github_repo.bat
REM  Cria o repositório no GitHub e faz o primeiro push.
REM  Pré-requisitos: Git e GitHub CLI (gh) autenticado (gh auth login)
REM  Uso:
REM    create_github_repo.bat [repo-name] [public|private] [owner] [description]
REM  Exemplos:
REM    create_github_repo.bat                         (usa o nome da pasta atual, private)
REM    create_github_repo.bat ZefeniaXMLConverter public
REM    create_github_repo.bat meu-repo private minha-org "Primeiro commit"
REM ============================================================

REM --- Parâmetros e defaults ---
set "REPO_NAME=%~1"
set "VISIBILITY=%~2"
set "OWNER=%~3"
set "DESCRIPTION=%~4"

for %%I in ("%cd%") do if not defined REPO_NAME set "REPO_NAME=%%~nI"
if /I "%VISIBILITY%"=="" set "VISIBILITY=private"
if /I not "%VISIBILITY%"=="public" if /I not "%VISIBILITY%"=="private" set "VISIBILITY=private"

echo.
echo === Criando repositório e enviando primeiro commit ===
echo Pasta atual: %cd%
echo Repositório: %REPO_NAME% (%VISIBILITY%)
if defined OWNER echo Dono      : %OWNER%
if defined DESCRIPTION echo Descricao: %DESCRIPTION%
echo.

REM --- Checagens de ferramentas ---
where git >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Git nao encontrado no PATH. Instale o Git e tente novamente.
  exit /b 1
)

where gh >nul 2>&1
if errorlevel 1 (
  echo [ERRO] GitHub CLI (gh) nao encontrado no PATH.
  echo        Instale a partir de https://cli.github.com/ e rode: gh auth login
  exit /b 1
)

REM --- Inicializa Git se necessario ---
if not exist .git (
  echo Inicializando repositório Git...
  git init >nul 2>&1
)

REM Garante branch 'main'
for /f "tokens=*" %%B in ('git symbolic-ref --short HEAD 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH set "BRANCH=main"
git checkout -B main >nul 2>&1
set "BRANCH=main"

REM Cria .gitignore basico para Node se nao existir
if not exist .gitignore (
  echo Criando .gitignore padrao...
  > .gitignore echo node_modules/
  >> .gitignore echo .env
  >> .gitignore echo dist/
  >> .gitignore echo coverage/
  >> .gitignore echo *.log
  >> .gitignore echo .DS_Store
)

REM Cria README se nao existir
if not exist README.md (
  echo Criando README.md...
  > README.md echo # %REPO_NAME%
  >> README.md echo.
  >> README.md echo Conversor de Bíblias XML para o formato Zefenia XML.
)

REM Adiciona e commita
echo Preparando primeiro commit...
git add -A >nul 2>&1
git commit -m "chore: initial commit" >nul 2>&1

REM Verifica se remote origin existe
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo Criando repositório no GitHub via gh...
  set "GH_CMD=gh repo create %REPO_NAME% --%VISIBILITY% --source . --remote origin --push"
  if defined OWNER set "GH_CMD=%GH_CMD% --owner %OWNER%"
  if defined DESCRIPTION set "GH_CMD=%GH_CMD% --description \"%DESCRIPTION%\""
  call %GH_CMD%
  if errorlevel 1 (
    echo [ERRO] Falha ao criar o repositório no GitHub.
    exit /b 1
  )
) else (
  echo Remote origin ja existe. Enviando para %BRANCH%...
  git push -u origin %BRANCH%
)

echo.
echo [OK] Repositório criado e primeiro push realizado.
git remote -v
echo.
endlocal
exit /b 0

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
const outAppDir = path.join(rootDir, '4Nav-App');
const resAppDir = path.join(outAppDir, 'resources', 'app');

console.log('1. Empacotando aplicativo desktop nativo 4Nav em:', outAppDir);

// Copy Electron runtime binaries
fs.cpSync(electronDist, outAppDir, { recursive: true, force: true });

const oldExe = path.join(outAppDir, 'electron.exe');
const newExe = path.join(outAppDir, '4Nav.exe');
if (fs.existsSync(oldExe)) {
  if (fs.existsSync(newExe)) fs.unlinkSync(newExe);
  fs.renameSync(oldExe, newExe);
}

// Copy application files into resources/app
fs.mkdirSync(resAppDir, { recursive: true });
fs.cpSync(path.join(rootDir, 'package.json'), path.join(resAppDir, 'package.json'), {
  force: true,
});
fs.cpSync(path.join(rootDir, 'electron'), path.join(resAppDir, 'electron'), {
  recursive: true,
  force: true,
});
fs.cpSync(path.join(rootDir, 'dist'), path.join(resAppDir, 'dist'), {
  recursive: true,
  force: true,
});

// Create convenient launcher at root Abrir 4Nav.bat
const batPath = path.join(rootDir, 'Abrir 4Nav.bat');
fs.writeFileSync(
  batPath,
  `@echo off\r\nset ELECTRON_RUN_AS_NODE=\r\nset CHROME_CRASHPAD_PIPE_NAME=\r\nstart "" "%~dp04Nav-App\\4Nav.exe"\r\n`,
  'utf8'
);

// Create Windows Shortcut (.lnk)
try {
  const lnkPath = path.join(rootDir, '4Nav.lnk').replace(/'/g, "''");
  const exePath = newExe.replace(/'/g, "''");
  const psScript = `
    $WshShell = New-Object -ComObject WScript.Shell;
    $s1 = $WshShell.CreateShortcut('${lnkPath}');
    $s1.TargetPath = '${exePath}';
    $s1.WorkingDirectory = '${outAppDir.replace(/'/g, "''")}';
    $s1.Description = '4Nav - Navegador Desktop Multi-Sessao Otimizado para Jogos Idle';
    $s1.Save();
  `.replace(/\r?\n/g, ' ');
  execSync(`powershell -NoProfile -Command "${psScript}"`);
} catch (err) {
  console.warn('Aviso ao criar atalho:', err.message);
}

console.log('2. Executável standalone criado com sucesso:', newExe);
console.log('3. Pronto para executar:', newExe);

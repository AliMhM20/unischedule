const fs = require('fs');
const path = require('path');

console.log('=== [Self-Healing] Preparing Desktop & Electron Configuration ===');

// 1. Determine Version
let targetVersion = process.env.APP_VERSION || process.argv[2];
if (targetVersion) {
  targetVersion = targetVersion.replace(/^v/, '').trim();
}

// 2. Patch package.json
const pkgPath = path.resolve('package.json');
let pkg = {};
if (fs.existsSync(pkgPath)) {
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (e) {
    pkg = {};
  }
}

pkg.name = 'unischedule';
pkg.main = 'electron/main.cjs';
if (targetVersion) {
  pkg.version = targetVersion;
  console.log('✓ Set version to: ' + targetVersion);
} else if (!pkg.version || pkg.version === '0.0.0') {
  pkg.version = '1.1.7';
}

pkg.scripts = pkg.scripts || {};
pkg.scripts['electron:build'] = 'vite build && electron-builder';
pkg.scripts['electron:dev'] = 'concurrently -k "vite --port=3000" "wait-on tcp:3000 && cross-env ELECTRON_START_URL=http://localhost:3000 NODE_ENV=development electron ."';

pkg.build = {
  appId: 'com.unischedule.app',
  productName: 'UniSchedule',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'build/**/*',
    'package.json'
  ],
  win: {
    icon: 'build/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'UniSchedule',
    include: 'build/installer.nsh'
  }
};

pkg.devDependencies = pkg.devDependencies || {};
pkg.devDependencies['electron'] = pkg.devDependencies['electron'] || '^43.4.0';
pkg.devDependencies['electron-builder'] = pkg.devDependencies['electron-builder'] || '^26.15.3';
pkg.devDependencies['cross-env'] = pkg.devDependencies['cross-env'] || '^10.1.0';
pkg.devDependencies['concurrently'] = pkg.devDependencies['concurrently'] || '^10.0.5';
pkg.devDependencies['wait-on'] = pkg.devDependencies['wait-on'] || '^9.1.0';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ Successfully validated and patched package.json for Electron');

// 3. Patch vite.config.ts
const viteConfigPath = path.resolve('vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  let viteContent = fs.readFileSync(viteConfigPath, 'utf8');
  if (!viteContent.includes('base:')) {
    viteContent = viteContent.replace(/return\s*\{/, "return {\n    base: './',");
    fs.writeFileSync(viteConfigPath, viteContent, 'utf8');
    console.log('✓ Injected base: ./ into vite.config.ts');
  } else {
    console.log('✓ vite.config.ts already has base config');
  }
}

// 4. Validate core Electron files
const electronMain = path.resolve('electron/main.cjs');
if (!fs.existsSync(electronMain)) {
  console.warn('⚠️ electron/main.cjs is missing, please verify repo files.');
}

console.log('=== [Self-Healing] Desktop Preparation Complete! ===');

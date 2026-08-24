// Server File Manager & Sandboxed Code Editor
class FileManager {
  constructor() {
    this.serverId = null;
    this.currentPath = '';
    this.aceEditor = null;
    this.activeEditingFile = null;
  }

  async renderFileManagerTab(container, serverId, currentPath = '') {
    this.serverId = serverId;
    this.currentPath = currentPath;

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Action Toolbar & Breadcrumbs -->
        <div class="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <!-- Breadcrumb Path -->
          <div class="flex items-center gap-1.5 text-xs font-mono text-slate-300 overflow-x-auto max-w-full">
            <button onclick="fileManager.navigateTo('')" class="text-cyan-400 hover:underline flex items-center gap-1">
              <i data-lucide="home" class="w-3.5 h-3.5"></i> /home/container
            </button>
            ${this.renderBreadcrumbsHTML(currentPath)}
          </div>

          <!-- Actions: New File, New Folder, Upload, Compress -->
          <div class="flex items-center gap-2 flex-wrap">
            <label class="btn-cyber px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload
              <input type="file" multiple class="hidden" onchange="fileManager.handleUpload(this)">
            </label>
            <button onclick="fileManager.showNewFileModal()" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1.5 transition">
              <i data-lucide="file-plus" class="w-3.5 h-3.5"></i> New File
            </button>
            <button onclick="fileManager.showNewFolderModal()" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1.5 transition">
              <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i> New Folder
            </button>
            <button onclick="fileManager.refresh()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 flex items-center justify-center">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Files List Table -->
        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th class="px-5 py-3">Name</th>
                <th class="px-5 py-3">Size</th>
                <th class="px-5 py-3">Last Modified</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="files-table-tbody" class="divide-y divide-white/5">
              <tr><td colspan="4" class="text-center py-8 text-slate-500">Loading files...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    await this.loadDirectory(this.currentPath);
    if (window.lucide) lucide.createIcons();
  }

  renderBreadcrumbsHTML(p) {
    if (!p) return '';
    const segments = p.split('/').filter(Boolean);
    let accum = '';
    return segments.map((seg, idx) => {
      accum += (accum ? '/' : '') + seg;
      const target = accum;
      return `
        <span class="text-slate-500">/</span>
        <button onclick="fileManager.navigateTo('${target}')" class="text-slate-300 hover:text-cyan-400 hover:underline">
          ${seg}
        </button>
      `;
    }).join('');
  }

  async loadDirectory(subPath = '') {
    this.currentPath = subPath;
    try {
      const data = await app.api(`/api/servers/${this.serverId}/files?directory=${encodeURIComponent(subPath)}`);
      const files = data.files || [];
      const tbody = document.getElementById('files-table-tbody');

      if (!tbody) return;

      if (files.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-500">This folder is empty.</td></tr>`;
        return;
      }

      tbody.innerHTML = files.map(item => {
        const itemRelPath = subPath ? `${subPath}/${item.name}` : item.name;
        const icon = item.isDirectory ? 'folder' : this.getFileIcon(item.name);
        const iconColor = item.isDirectory ? 'text-cyan-400' : 'text-slate-400';

        return `
          <tr class="hover:bg-white/5 transition">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5 cursor-pointer" onclick="${item.isDirectory ? `fileManager.navigateTo('${itemRelPath}')` : `fileManager.openEditor('${itemRelPath}')`}">
                <i data-lucide="${icon}" class="w-4 h-4 ${iconColor} shrink-0"></i>
                <span class="font-semibold text-white hover:text-cyan-400 truncate max-w-sm">${item.name}</span>
              </div>
            </td>
            <td class="px-5 py-3 font-mono text-[11px] text-slate-400">${item.isDirectory ? '-' : this.formatSize(item.size)}</td>
            <td class="px-5 py-3 text-slate-400 text-[11px]">${new Date(item.modifiedAt).toLocaleString()}</td>
            <td class="px-5 py-3 text-right space-x-1.5">
              ${!item.isDirectory ? `
                <a href="/api/servers/${this.serverId}/files/download?file=${encodeURIComponent(itemRelPath)}&token=${app.token}" target="_blank" title="Download" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                </a>
              ` : ''}
              ${item.name.endsWith('.zip') ? `
                <button onclick="fileManager.extractZip('${itemRelPath}')" title="Extract Zip" class="px-2 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-[11px]">
                  Unzip
                </button>
              ` : ''}
              <button onclick="fileManager.showRenameModal('${itemRelPath}', '${item.name}')" title="Rename" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="fileManager.deleteItem('${itemRelPath}')" title="Delete" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      app.toast(err.message, 'error');
    }
    if (window.lucide) lucide.createIcons();
  }

  navigateTo(p) {
    this.renderFileManagerTab(document.getElementById('subtab-content-area'), this.serverId, p);
  }

  refresh() {
    this.loadDirectory(this.currentPath);
  }

  getFileIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    if (['jar', 'zip', 'tar', 'gz'].includes(ext)) return 'archive';
    if (['json', 'yml', 'yaml', 'properties', 'toml', 'cfg', 'ini'].includes(ext)) return 'file-code';
    if (['js', 'py', 'sh', 'ts', 'html', 'css'].includes(ext)) return 'code';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'image';
    return 'file-text';
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Open Code Editor Modal
  async openEditor(filePath) {
    this.activeEditingFile = filePath;
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div class="glass-panel w-full max-w-5xl h-[85vh] p-6 rounded-3xl border border-white/15 shadow-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <i data-lucide="file-code" class="w-5 h-5 text-cyan-400"></i>
              <h3 class="text-sm font-bold text-white font-mono truncate max-w-md">${filePath}</h3>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="fileManager.saveActiveFile()" class="btn-cyber px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="save" class="w-3.5 h-3.5"></i> Save File
              </button>
              <button onclick="document.getElementById('modal-container').innerHTML=''" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Code Editor Body -->
          <div id="ace-code-editor" class="flex-1 my-4 rounded-xl overflow-hidden border border-white/10"></div>

          <div class="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-white/10">
            <span>Press Ctrl+S / Cmd+S to quickly save file.</span>
            <span class="font-mono text-cyan-400">${filePath.split('.').pop().toUpperCase()}</span>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const data = await app.api(`/api/servers/${this.serverId}/files/content?file=${encodeURIComponent(filePath)}`);
      
      this.aceEditor = ace.edit('ace-code-editor');
      this.aceEditor.setTheme('ace/theme/tomorrow_night_eighties');
      
      // Auto-detect mode
      const ext = filePath.split('.').pop().toLowerCase();
      const modeMap = {
        js: 'javascript',
        json: 'json',
        py: 'python',
        yml: 'yaml',
        yaml: 'yaml',
        properties: 'properties',
        sh: 'sh',
        html: 'html',
        css: 'css',
        txt: 'text'
      };
      const mode = modeMap[ext] || 'text';
      this.aceEditor.session.setMode(`ace/mode/${mode}`);
      this.aceEditor.setValue(data.content || '', -1);
      this.aceEditor.setFontSize(13);

      // Bind Ctrl+S
      this.aceEditor.commands.addCommand({
        name: 'save',
        bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
        exec: () => this.saveActiveFile()
      });
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async saveActiveFile() {
    if (!this.aceEditor || !this.activeEditingFile) return;
    const content = this.aceEditor.getValue();

    try {
      const data = await app.api(`/api/servers/${this.serverId}/files/content`, {
        method: 'POST',
        body: JSON.stringify({ filePath: this.activeEditingFile, content })
      });

      if (data.success) {
        app.toast('File saved successfully!', 'success');
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  showNewFileModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="file-plus" class="w-5 h-5 text-cyan-400"></i> Create New File
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">File Name</label>
            <input type="text" id="new-file-name" placeholder="server.properties / app.js" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="fileManager.handleCreateFile()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Create File</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateFile() {
    const name = document.getElementById('new-file-name').value.trim();
    if (!name) return;
    const fullPath = this.currentPath ? `${this.currentPath}/${name}` : name;

    try {
      await app.api(`/api/servers/${this.serverId}/files/content`, {
        method: 'POST',
        body: JSON.stringify({ filePath: fullPath, content: '' })
      });
      document.getElementById('modal-container').innerHTML = '';
      app.toast('File created!', 'success');
      this.refresh();
      this.openEditor(fullPath);
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  showNewFolderModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="folder-plus" class="w-5 h-5 text-cyan-400"></i> Create New Directory
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Directory Name</label>
            <input type="text" id="new-dir-name" placeholder="plugins / mods / src" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="fileManager.handleCreateDirectory()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Create Folder</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateDirectory() {
    const name = document.getElementById('new-dir-name').value.trim();
    if (!name) return;
    const fullPath = this.currentPath ? `${this.currentPath}/${name}` : name;

    try {
      await app.api(`/api/servers/${this.serverId}/files/directory`, {
        method: 'POST',
        body: JSON.stringify({ dirPath: fullPath })
      });
      document.getElementById('modal-container').innerHTML = '';
      app.toast('Folder created!', 'success');
      this.refresh();
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  showRenameModal(oldPath, name) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="edit-2" class="w-5 h-5 text-cyan-400"></i> Rename File / Folder
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">New Name</label>
            <input type="text" id="rename-new-name" value="${name}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="fileManager.handleRename('${oldPath}')" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Rename</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleRename(oldPath) {
    const newName = document.getElementById('rename-new-name').value.trim();
    if (!newName) return;
    const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
    const newPath = parentDir ? `${parentDir}/${newName}` : newName;

    try {
      await app.api(`/api/servers/${this.serverId}/files/rename`, {
        method: 'POST',
        body: JSON.stringify({ oldPath, newPath })
      });
      document.getElementById('modal-container').innerHTML = '';
      app.toast('Renamed item.', 'success');
      this.refresh();
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteItem(itemPath) {
    if (!confirm(`Are you sure you want to delete "${itemPath}"?`)) return;
    try {
      await app.api(`/api/servers/${this.serverId}/files/delete`, {
        method: 'POST',
        body: JSON.stringify({ itemPath })
      });
      app.toast('Deleted successfully.', 'info');
      this.refresh();
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async extractZip(zipFilePath) {
    try {
      app.toast('Extracting archive...', 'info');
      await app.api(`/api/servers/${this.serverId}/files/extract`, {
        method: 'POST',
        body: JSON.stringify({ zipFilePath, destPath: this.currentPath })
      });
      app.toast('Archive extracted!', 'success');
      this.refresh();
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async handleUpload(input) {
    if (!input.files || input.files.length === 0) return;
    app.toast(`Uploading ${input.files.length} file(s)...`, 'info');

    for (const file of input.files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory', this.currentPath);

      try {
        await app.api(`/api/servers/${this.serverId}/files/upload?directory=${encodeURIComponent(this.currentPath)}`, {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        app.toast(`Upload failed for ${file.name}: ${err.message}`, 'error');
      }
    }

    app.toast('File upload completed!', 'success');
    this.refresh();
  }
}

window.fileManager = new FileManager();


(function() {
    // Utility functions
    function formatSize(bytes) {
        if (!bytes || bytes === 0) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(1) + ' GB';
    }

    function getFileIcon(mimeType) {
        if (!mimeType) return '📄';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('video')) return '🎬';
        if (mimeType.includes('presentation') || mimeType.includes('slides')) return '📊';
        if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) return '📗';
        if (mimeType.includes('document') || mimeType.includes('word')) return '📘';
        return '📄';
    }

    function getTypeBadge(mimeType) {
        if (!mimeType) return ['기타', 'b-other'];
        if (mimeType.includes('pdf')) return ['PDF', 'b-pdf'];
        if (mimeType.includes('video')) return ['VIDEO', 'b-video'];
        if (mimeType.includes('presentation') || mimeType.includes('slides')) return ['PPT', 'b-ppt'];
        if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) return ['EXCEL', 'b-sheet'];
        if (mimeType.includes('document') || mimeType.includes('word')) return ['DOC', 'b-doc'];
        return ['기타', 'b-other'];
    }

    // Count files recursively
    function countFiles(node) {
        var counts = { total: 0, pdf: 0, video: 0, ppt: 0, folders: 0 };
        if (!node.children) return counts;
        node.children.forEach(function(child) {
            if (child.type === 'folder') {
                counts.folders++;
                var sub = countFiles(child);
                counts.total += sub.total;
                counts.pdf += sub.pdf;
                counts.video += sub.video;
                counts.ppt += sub.ppt;
                counts.folders += sub.folders;
            } else {
                counts.total++;
                if (child.mimeType && child.mimeType.includes('pdf')) counts.pdf++;
                if (child.mimeType && child.mimeType.includes('video')) counts.video++;
                if (child.mimeType && (child.mimeType.includes('presentation') || child.mimeType.includes('slides'))) counts.ppt++;
            }
        });
        return counts;
    }

    // Render file item
    function renderFile(file) {
        var icon = getFileIcon(file.mimeType);
        var badge = getTypeBadge(file.mimeType);
        var size = formatSize(file.size);
        var html = '<div class="file-item" data-name="' + escapeAttr(file.name) + '">';
        html += '<span class="file-icon">' + icon + '</span>';
        html += '<div class="file-info">';
        html += '<a class="file-name" href="' + escapeAttr(file.url) + '" target="_blank" title="' + escapeAttr(file.name) + '">' + escapeHtml(file.name) + '</a>';
        html += '<div class="file-meta"><span class="badge ' + badge[1] + '">' + badge[0] + '</span>';
        if (size) html += ' &nbsp; ' + size;
        html += '</div></div></div>';
        return html;
    }

    function escapeHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function escapeAttr(str) {
        return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // Render subfolder
    function renderSubfolder(folder) {
        var fileCount = 0;
        var html = '';
        if (folder.children) {
            folder.children.forEach(function(child) {
                if (child.type === 'file') fileCount++;
            });
        }
        html += '<div class="subfolder">';
        html += '<div class="subfolder-hdr" onclick="toggleSub(this)">';
        html += '<span>📂</span><span style="flex:1">' + escapeHtml(folder.name) + '</span>';
        html += '<span class="tgl">▼</span></div>';
        html += '<div class="subfolder-body">';
        if (folder.children) {
            folder.children.forEach(function(child) {
                if (child.type === 'folder') {
                    html += renderSubfolder(child);
                } else {
                    html += renderFile(child);
                }
            });
        }
        html += '</div></div>';
        return html;
    }

    // Render main folder section
    function renderSection(folder, index) {
        var fileCount = countFiles(folder).total;
        var html = '<div class="folder-section" data-section="' + index + '">';
        html += '<div class="folder-hdr" onclick="toggleSection(this)">';
        html += '<span class="icon">📁</span>';
        html += '<span class="ttl">' + escapeHtml(folder.name) + '</span>';
        html += '<span class="cnt">' + fileCount + ' files</span>';
        html += '<span class="tgl">▼</span></div>';
        html += '<div class="folder-body">';
        if (folder.children) {
            folder.children.forEach(function(child) {
                if (child.type === 'folder') {
                    html += renderSubfolder(child);
                } else {
                    html += renderFile(child);
                }
            });
        }
        html += '</div></div>';
        return html;
    }

    // Build page
    var counts = countFiles(DATA);
    var statsEl = document.getElementById('stats');
    statsEl.innerHTML = '<div class="stat-card"><div class="num">' + counts.folders + '</div><div class="lbl">폴더</div></div>'
        + '<div class="stat-card"><div class="num">' + counts.total + '</div><div class="lbl">파일</div></div>'
        + '<div class="stat-card"><div class="num">' + counts.pdf + '</div><div class="lbl">PDF</div></div>'
        + '<div class="stat-card"><div class="num">' + counts.video + '</div><div class="lbl">동영상</div></div>'
        + '<div class="stat-card"><div class="num">' + counts.ppt + '</div><div class="lbl">PPT</div></div>';

    var contentEl = document.getElementById('content');
    var contentHtml = '';

    // Sort children by name
    var children = DATA.children.slice().sort(function(a, b) {
        return a.name.localeCompare(b.name, 'ko');
    });

    children.forEach(function(child, i) {
        if (child.type === 'folder') {
            contentHtml += renderSection(child, i);
        }
    });
    contentEl.innerHTML = contentHtml;

    // Search functionality
    var searchInput = document.getElementById('searchInput');
    var noResults = document.getElementById('noResults');

    searchInput.addEventListener('input', function() {
        var query = this.value.toLowerCase().trim();
        var sections = document.querySelectorAll('.folder-section');
        var anyVisible = false;

        if (!query) {
            sections.forEach(function(s) { s.style.display = ''; });
            document.querySelectorAll('.file-item').forEach(function(f) { f.style.display = ''; });
            document.querySelectorAll('.subfolder').forEach(function(f) { f.style.display = ''; });
            noResults.style.display = 'none';
            return;
        }

        sections.forEach(function(section) {
            var files = section.querySelectorAll('.file-item');
            var sectionVisible = false;
            files.forEach(function(file) {
                var name = (file.getAttribute('data-name') || '').toLowerCase();
                if (name.includes(query)) {
                    file.style.display = '';
                    sectionVisible = true;
                } else {
                    file.style.display = 'none';
                }
            });
            // Show subfolders if they contain visible files
            var subfolders = section.querySelectorAll('.subfolder');
            subfolders.forEach(function(sf) {
                var visFiles = sf.querySelectorAll('.file-item[style=""],.file-item:not([style])');
                var hasVisible = false;
                visFiles.forEach(function(f) {
                    if (f.style.display !== 'none') hasVisible = true;
                });
                sf.style.display = hasVisible ? '' : 'none';
            });
            section.style.display = sectionVisible ? '' : 'none';
            if (sectionVisible) anyVisible = true;
            // Expand visible sections
            if (sectionVisible) {
                section.querySelector('.folder-body').classList.remove('closed');
                section.querySelector('.folder-hdr').classList.remove('closed');
            }
        });
        noResults.style.display = anyVisible ? 'none' : 'block';
    });
})();

// Toggle functions (global)
function toggleSection(el) {
    var body = el.nextElementSibling;
    el.classList.toggle('closed');
    body.classList.toggle('closed');
}
function toggleSub(el) {
    var body = el.nextElementSibling;
    body.classList.toggle('closed');
    var tgl = el.querySelector('.tgl');
    if (tgl) tgl.textContent = body.classList.contains('closed') ? '▶' : '▼';
}

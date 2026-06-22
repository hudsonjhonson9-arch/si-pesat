/**
 * Google Apps Script Web App for Centralized SI-PESAT Drive Storage
 *
 * Security:
 * - All requests MUST include a valid Supabase JWT in Authorization header
 * - Token diverifikasi via Supabase Auth API sebelum memproses upload
 * - User identity dicatat di audit trail Drive
 *
 * Deployment:
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code into Code.gs.
 * 3. Set SUPABASE_URL and SUPABASE_ANON_KEY below.
 * 4. Deploy -> New deployment -> Web app.
 * 5. Execute as 'Me'. Who has access: 'Anyone'.
 * 6. Copy URL ke .env.local sebagai VITE_GOOGLE_SCRIPT_URL.
 */

const SUPABASE_URL = 'https://pmtmczqxrciaslgmjfim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdG1jenF4cmNpYXNsZ21qZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzY2NzQsImV4cCI6MjA5NjgxMjY3NH0.5kF1pq_MyvzqCl3Jhv2HvbNwjCpyBQWllhZUnsHZlMg';

const UPLOAD_FOLDER_ID = 'YOUR_FOLDER_ID';
const ROOT_FOLDER_NAME = 'SI-PESAT KKA Inspektorat';

/**
 * Verifikasi Supabase JWT token via Supabase Auth API
 */
function verifyToken(accessToken) {
  if (!accessToken) return null;
  try {
    const response = UrlFetchApp.fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'apikey': SUPABASE_ANON_KEY
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
    return null;
  } catch (e) {
    console.error('Token verification error: ' + e.toString());
    return null;
  }
}

function doPost(e) {
  try {
    // Verifikasi JWT token
    var authHeader = '';
    if (e && e.parameter && e.parameter.authorization) {
      authHeader = e.parameter.authorization;
    }
    if (!authHeader && e && e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        if (parsed.authorization) authHeader = parsed.authorization;
      } catch (err) {}
    }

    var token = null;
    if (authHeader && authHeader.indexOf('Bearer ') === 0) {
      token = authHeader.substring(7);
    }

    var user = verifyToken(token);
    if (!user) {
      return responseError('Unauthorized: Supabase token tidak valid atau telah kedaluwarsa. Silakan login ulang.');
    }

    var userId = user.id || 'unknown';
    var userEmail = user.email || 'unknown@email';

    if (!e || !e.postData || !e.postData.contents) {
      return responseError('No data received');
    }

    const payload = JSON.parse(e.postData.contents);
    const fileName = payload.name;
    const mimeType = payload.mimeType;
    const base64Data = payload.base64;

    if (payload.action !== 'copy') {
      if (!fileName || !base64Data) {
        return responseError('Missing name or base64 data for upload');
      }
    } else {
      if (!payload.sourceId) {
        return responseError('Missing sourceId for copy action');
      }
    }

    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
    } catch (err) {
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const existingFolders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
        if (existingFolders.hasNext()) {
          rootFolder = existingFolders.next();
        } else {
          rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
        }
      } finally {
        lock.releaseLock();
      }
    }

    function getOrCreateFolder(parent, folderName) {
      if (!folderName) return parent;
      const sanitized = folderName.replace(/[\/\\:*?"<>|]/g, '_').trim();
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const folders = parent.getFoldersByName(sanitized);
        if (folders.hasNext()) {
          return folders.next();
        } else {
          return parent.createFolder(sanitized);
        }
      } finally {
        lock.releaseLock();
      }
    }

    var currentFolder = rootFolder;
    if (payload.year) {
      currentFolder = getOrCreateFolder(currentFolder, 'TA ' + payload.year);
    }
    if (payload.opd) {
      currentFolder = getOrCreateFolder(currentFolder, payload.opd);
    }
    if (payload.auditType) {
      currentFolder = getOrCreateFolder(currentFolder, payload.auditType);
    }

    var file;
    if (payload.action === 'copy') {
      const sourceFile = DriveApp.getFileById(payload.sourceId);
      const newName = fileName || sourceFile.getName();
      file = sourceFile.makeCopy(newName, currentFolder);
    } else {
      const decodedBytes = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decodedBytes, mimeType || 'application/octet-stream', fileName);
      file = currentFolder.createFile(blob);
    }

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Tambahkan deskripsi file dengan info user untuk audit trail
    file.setDescription('Diunggah oleh: ' + userEmail + ' (ID: ' + userId + ')\nWaktu: ' + new Date().toISOString());

    const result = {
      id: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl(),
      folderPath: buildFolderPath(currentFolder),
      uploadedBy: userEmail
    };

    return responseSuccess(result);

  } catch (error) {
    return responseError(error.toString());
  }
}

function buildFolderPath(folder) {
  try {
    const parts = [];
    var current = folder;
    while (current) {
      parts.unshift(current.getName());
      const parents = current.getParents();
      if (parents.hasNext()) {
        current = parents.next();
        if (current.getId() === DriveApp.getRootFolder().getId()) break;
      } else {
        break;
      }
    }
    return parts.join(' / ');
  } catch (e) {
    return folder.getName();
  }
}

function responseSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function responseError(message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

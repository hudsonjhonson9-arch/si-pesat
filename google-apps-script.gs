/**
 * Google Apps Script Web App for Centralized SI-PESAT Drive Storage
 * 
 * Instructions:
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code into Code.gs.
 * 3. (Optional) Replace 'YOUR_FOLDER_ID' with the ID of the specific root folder in your
 *    Google Drive. If left as 'YOUR_FOLDER_ID', a folder named ROOT_FOLDER_NAME will be
 *    created automatically in My Drive.
 * 4. Click 'Deploy' -> 'New deployment'.
 * 5. Select type 'Web app'.
 * 6. Execute as 'Me' (your account).
 * 7. Who has access: 'Anyone'.
 * 8. Click 'Deploy' and authorize the app.
 * 9. Copy the "Web app URL" and paste it into your SI-PESAT `.env.local` as VITE_GOOGLE_SCRIPT_URL.
 */

// ID Folder root di Google Drive (opsional). Jika tidak diisi, akan dibuat folder baru.
const UPLOAD_FOLDER_ID = 'YOUR_FOLDER_ID';

// Nama folder root yang akan dibuat otomatis jika UPLOAD_FOLDER_ID tidak valid
const ROOT_FOLDER_NAME = 'SI-PESAT KKA Inspektorat';

function doPost(e) {
  try {
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

    // Get or create root folder
    let rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
    } catch (err) {
      // Folder ID tidak valid, cari atau buat folder root berdasarkan nama
      const existingFolders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
      if (existingFolders.hasNext()) {
        rootFolder = existingFolders.next();
      } else {
        rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
      }
    }

    // Helper: get or create subfolder
    function getOrCreateFolder(parent, folderName) {
      if (!folderName) return parent;
      const sanitized = folderName.replace(/[\/\\:*?"<>|]/g, '_').trim();
      const folders = parent.getFoldersByName(sanitized);
      if (folders.hasNext()) {
        return folders.next();
      } else {
        return parent.createFolder(sanitized);
      }
    }

    // Folder structure: Root -> TA {year} -> {OPD Name}
    let currentFolder = rootFolder;
    if (payload.year) {
      currentFolder = getOrCreateFolder(currentFolder, 'TA ' + payload.year);
    }
    if (payload.opd) {
      currentFolder = getOrCreateFolder(currentFolder, payload.opd);
    }

    let file;
    if (payload.action === 'copy') {
      // Copy existing file from Drive
      const sourceFile = DriveApp.getFileById(payload.sourceId);
      const newName = fileName || sourceFile.getName();
      file = sourceFile.makeCopy(newName, currentFolder);
    } else {
      // Decode base64 and upload new file
      const decodedBytes = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decodedBytes, mimeType || 'application/octet-stream', fileName);
      file = currentFolder.createFile(blob);
    }
    
    // Set sharing: anyone with link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const result = {
      id: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl(),
      folderPath: buildFolderPath(currentFolder)
    };

    return responseSuccess(result);

  } catch (error) {
    return responseError(error.toString());
  }
}

// Build a readable folder path string for response
function buildFolderPath(folder) {
  try {
    const parts = [];
    let current = folder;
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

// Support OPTIONS for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Google Apps Script Web App for Centralized SI-PESAT Drive Storage
 * 
 * Instructions:
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code into Code.gs.
 * 3. Replace 'YOUR_FOLDER_ID' with the ID of the specific folder in your Google Drive where you want to store documents.
 * 4. Click 'Deploy' -> 'New deployment'.
 * 5. Select type 'Web app'.
 * 6. Execute as 'Me' (your account).
 * 7. Who has access: 'Anyone'.
 * 8. Click 'Deploy' and authorize the app.
 * 9. Copy the "Web app URL" and paste it into your SI-PESAT `.env.local` as VITE_GOOGLE_SCRIPT_URL.
 */

const UPLOAD_FOLDER_ID = 'YOUR_FOLDER_ID'; // Ganti dengan ID Folder Drive Anda

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseError('No data received');
    }

    const payload = JSON.parse(e.postData.contents);
    const fileName = payload.name;
    const mimeType = payload.mimeType;
    const base64Data = payload.base64;

    if (!fileName || !base64Data) {
      return responseError('Missing name or base64 data');
    }

    // Decode base64 to blob
    const decodedBytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedBytes, mimeType || 'application/octet-stream', fileName);

    // Get Folder
    // Get Root Folder
    let rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
    } catch (err) {
      // If folder not found, use root folder
      rootFolder = DriveApp.getRootFolder();
    }

    // Helper function to get or create folder
    function getOrCreateFolder(parent, folderName) {
      if (!folderName) return parent;
      
      const folders = parent.getFoldersByName(folderName);
      if (folders.hasNext()) {
        return folders.next();
      } else {
        return parent.createFolder(folderName);
      }
    }

    // Navigate or create nested folders: root -> year -> opd
    let currentFolder = rootFolder;
    if (payload.year) {
      currentFolder = getOrCreateFolder(currentFolder, "TA " + payload.year);
    }
    if (payload.opd) {
      currentFolder = getOrCreateFolder(currentFolder, payload.opd);
    }

    // Create File in the final folder
    const file = currentFolder.createFile(blob);
    
    // Set permission to anyone with link can view (optional, but recommended for inspectorate viewing)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const result = {
      id: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl()
    };

    return responseSuccess(result);

  } catch (error) {
    return responseError(error.toString());
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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

import React from 'react';

// Helper function to get proper MIME type
const getProperContentType = (contentType, fileName) => {
  // If it's already a proper MIME type, return it
  if (contentType.includes('/')) {
    return contentType;
  }

  // Map common file extensions to MIME types
  const extensionToMime = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'jfif': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
  };

  // Try to get MIME type from file extension
  const extension = fileName.split('.').pop().toLowerCase();
  if (extensionToMime[extension]) {
    return extensionToMime[extension];
  }

  // Try to get MIME type from provided content type
  if (extensionToMime[contentType.toLowerCase()]) {
    return extensionToMime[contentType.toLowerCase()];
  }

  // Default to binary if we can't determine the type
  return 'application/octet-stream';
};

const TestFilePreview = ({ file }) => {
  const openFileInNewTab = () => {
    try {
      const { data, fileName, contentType: originalContentType } = file;
      
      // Get proper content type
      const contentType = getProperContentType(originalContentType, fileName);
      
      // Debug logs
      console.log('File data:', {
        fileName,
        originalContentType,
        contentType,
        dataLength: data ? data.length : 0,
        dataStart: data ? data.substring(0, 50) : 'no data'
      });

      // Create a blob URL for viewing
      const createBlobUrl = (base64Data, type) => {
        console.log('Creating blob for type:', type);
        
        try {
          // Remove data URL prefix if present
          const base64Content = base64Data.includes('base64,') 
            ? base64Data.split('base64,')[1] 
            : base64Data;
          
          console.log('Base64 content length:', base64Content.length);

          const binaryString = window.atob(base64Content);
          console.log('Binary string length:', binaryString.length);

          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type });
          console.log('Created blob:', {
            size: blob.size,
            type: blob.type
          });

          return URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error in createBlobUrl:', error);
          throw error;
        }
      };

      console.log('Attempting to create blob URL');
      const blobUrl = createBlobUrl(data, contentType);
      console.log('Created blob URL:', blobUrl);

      const newWindow = window.open('', '_blank');
      console.log('New window opened:', !!newWindow);
      
      if (!newWindow) {
        throw new Error('Popup blocked. Please allow popups to view files.');
      }

      // Handle different file types
      if (contentType.startsWith('image/')) {
        console.log('Handling image file');
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #1a1a1a;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
                .error {
                  color: red;
                  padding: 20px;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <img 
                src="${blobUrl}" 
                alt="${fileName}"
                onerror="document.body.innerHTML = '<div class=\'error\'>Error loading image</div>'"
              />
            </body>
          </html>
        `);
      } else if (contentType === 'application/pdf') {
        console.log('Handling PDF file');
        newWindow.location.href = blobUrl;
      } else if (contentType.startsWith('text/')) {
        console.log('Handling text file');
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #1a1a1a;
                  color: #fff;
                  font-family: monospace;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
                .error {
                  color: red;
                  padding: 20px;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <pre id="content"></pre>
              <script>
                fetch('${blobUrl}')
                  .then(response => response.text())
                  .then(text => {
                    document.getElementById('content').textContent = text;
                  })
                  .catch(error => {
                    document.body.innerHTML = '<div class="error">Error loading text: ' + error.message + '</div>';
                  });
              </script>
            </body>
          </html>
        `);
      } else if (contentType.startsWith('video/')) {
        console.log('Handling video file');
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #1a1a1a;
                }
                video {
                  max-width: 100%;
                  max-height: 100vh;
                }
                .error {
                  color: red;
                  padding: 20px;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <video 
                src="${blobUrl}" 
                controls 
                autoplay
                onerror="document.body.innerHTML = '<div class=\'error\'>Error loading video</div>'"
              >
                Your browser does not support the video tag.
              </video>
            </body>
          </html>
        `);
      } else if (contentType.startsWith('audio/')) {
        console.log('Handling audio file');
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #1a1a1a;
                  color: #fff;
                  font-family: system-ui;
                }
                .container {
                  text-align: center;
                }
                h1 {
                  margin-bottom: 20px;
                }
                .error {
                  color: red;
                  padding: 20px;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${fileName}</h1>
                <audio 
                  src="${blobUrl}" 
                  controls 
                  autoplay
                  onerror="document.body.innerHTML = '<div class=\'error\'>Error loading audio</div>'"
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </body>
          </html>
        `);
      } else {
        console.log('Unsupported file type, triggering download');
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      newWindow.document.close();
      console.log('Window document closed');

      // Clean up the blob URL after the window is loaded
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        console.log('Blob URL revoked');
      }, 1000);

    } catch (error) {
      console.error('Error in openFileInNewTab:', error);
      alert(error.message);
    }
  };

  return (
    <button
      onClick={openFileInNewTab}
      className="text-blue-400 hover:text-blue-500 flex items-center gap-1"
    >
      <span>{file.fileName}</span>
      <TestFileIcon contentType={getProperContentType(file.contentType, file.fileName)} />
    </button>
  );
};

// File type icons component
const TestFileIcon = ({ contentType }) => {
  if (contentType.startsWith('image/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
  } else if (contentType === 'application/pdf') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  } else if (contentType.startsWith('video/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    );
  } else if (contentType.startsWith('audio/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  } else if (contentType.startsWith('text/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  } else {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
      </svg>
    );
  }
};

export default TestFilePreview; 
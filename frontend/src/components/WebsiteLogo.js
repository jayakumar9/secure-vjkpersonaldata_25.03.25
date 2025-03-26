import React, { useState, useEffect } from 'react';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const COMPRESSED_IMAGE_SIZE = 200; // 200px width/height max

const WebsiteLogo = ({ website, onLogoChange, isEditing = false, existingLogo = null }) => {
  const [logoError, setLogoError] = useState(false);
  const [showUploadOption, setShowUploadOption] = useState(false);
  const [customLogo, setCustomLogo] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Helper function to get domain from website URL
  const getDomain = (url) => {
    return url?.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '') || '';
  };

  // Helper function to get first two letters for default logo
  const getDefaultLogoText = (url) => {
    const domain = getDomain(url);
    return domain.substring(0, 2).toUpperCase() || '??';
  };

  // Get website logo URLs
  const getWebsiteLogo = (url) => {
    const domain = getDomain(url);
    
    // Special cases for known domains with reliable direct logo URLs
    const specialDomains = {
      'gmail.com': 'https://www.google.com/gmail/about/static/images/logo-gmail.png',
      'google.com': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
      'youtube.com': 'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png',
      'github.com': 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      'yahoo.com': 'https://s.yimg.com/cv/apiv2/default/20201027/logo-new-yahoo.png'
    };

    return specialDomains[domain] || null;
  };

  // Initialize logo from existing data
  useEffect(() => {
    if (existingLogo?.data) {
      setCustomLogo(existingLogo.data);
      setLogoError(false);
      setShowUploadOption(isEditing);
    } else {
      setCustomLogo(null);
      setLogoError(false);
      setShowUploadOption(isEditing);
    }
  }, [existingLogo, isEditing]);

  const handleLogoError = () => {
    setLogoError(true);
    setShowUploadOption(isEditing);
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const logoData = {
        data: reader.result,
        fileName: file.name,
        contentType: file.type
      };
      setCustomLogo(reader.result);
      if (onLogoChange) {
        onLogoChange(logoData);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setUploadError(null);

    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      try {
        const compressedFile = await compressImage(file);
        if (compressedFile.size > MAX_FILE_SIZE) {
          setUploadError('Image is too large. Please select a smaller image (max 1MB)');
          return;
        }
        processFile(compressedFile);
      } catch (err) {
        setUploadError('Error processing image. Please try another file.');
      }
    } else {
      processFile(file);
    }
  };

  // Compress image function
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > COMPRESSED_IMAGE_SIZE) {
              height = Math.round((height * COMPRESSED_IMAGE_SIZE) / width);
              width = COMPRESSED_IMAGE_SIZE;
            }
          } else {
            if (height > COMPRESSED_IMAGE_SIZE) {
              width = Math.round((width * COMPRESSED_IMAGE_SIZE) / height);
              height = COMPRESSED_IMAGE_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Show upload option container
  const UploadOption = () => (
    <div className="mt-2 text-center">
      <label className="cursor-pointer text-blue-500 hover:text-blue-600 text-sm">
        {customLogo ? 'Change logo' : 'Upload custom logo'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
      {uploadError && (
        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">Max size: 1MB</p>
    </div>
  );

  if (customLogo) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative group">
          <img
            src={customLogo}
            alt={`${website} custom logo`}
            className="w-8 h-8 rounded-full object-contain"
          />
          {isEditing && (
            <button
              onClick={() => {
                setCustomLogo(null);
                if (onLogoChange) onLogoChange(null);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          )}
        </div>
        {isEditing && <UploadOption />}
      </div>
    );
  }

  const logoUrl = getWebsiteLogo(website);
  const defaultText = getDefaultLogoText(website);

  if (logoError || !logoUrl) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
          {defaultText}
        </div>
        {showUploadOption && <UploadOption />}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <img
        src={logoUrl}
        alt={`${website} logo`}
        onError={handleLogoError}
        className="w-8 h-8 rounded-full object-contain"
      />
      {isEditing && <UploadOption />}
    </div>
  );
};

export default WebsiteLogo; 
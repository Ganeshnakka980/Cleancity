const getFileUrl = (req, filename) => {
  if (!filename) return '';
  // Clean backslashes for Windows path compatibility
  const relativePath = `/uploads/${filename.replace(/\\/g, '/').split('/uploads/').pop()}`;
  return relativePath;
};

module.exports = {
  getFileUrl
};

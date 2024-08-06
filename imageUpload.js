const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read the arguments
const [,, filePath, token, parentId] = process.argv;

const fileName = path.basename(filePath);

fs.readFile(filePath, { encoding: 'base64' }, (err, fileEncoded) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const payload = {
    name: fileName,
    type: 'image',
    isPublic: true,
    data: fileEncoded,
    parentId,
  };

  axios.post('http://0.0.0.0:5000/files', payload, {
    headers: { 'X-Token': token },
  })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error('Error uploading file:', error);
    });
});

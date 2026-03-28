const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

(async () => {
  const idPath = path.join(__dirname, 'dummy-id.png');
  const selfiePath = path.join(__dirname, 'dummy-selfie.png');
  fs.writeFileSync(idPath, 'fake-id');
  fs.writeFileSync(selfiePath, 'fake-selfie');

  const formData = new FormData();
  formData.append('id', fs.createReadStream(idPath));
  formData.append('selfie', fs.createReadStream(selfiePath));
  formData.append('address', '0x5d7abed0761bf0a71308da8ae0b7982bf2049013');

  const res = await fetch('http://127.0.0.1:5000/verify', { method: 'POST', body: formData });
  const data = await res.json();
  console.log('status', res.status);
  console.log(JSON.stringify(data, null, 2));

  fs.unlinkSync(idPath);
  fs.unlinkSync(selfiePath);
})();

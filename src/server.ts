import express from 'express';
import "./config/env/envConfig";

const serverr = express();
const PORT = process.env.PORT || 3000;

serverr.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

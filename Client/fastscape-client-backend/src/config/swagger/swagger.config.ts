import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

const OPENAPI_PATH = path.join(process.cwd(), 'src/docs/openapi');

export const loadOpenApiDocument = () => {
  const rootFile = path.join(OPENAPI_PATH, 'index.yaml');
  const rootDoc = yaml.load(fs.readFileSync(rootFile, 'utf8')) as any;

  // Initialize components and paths if not present
  rootDoc.components = rootDoc.components || {};
  rootDoc.components.schemas = rootDoc.components.schemas || {};
  rootDoc.paths = rootDoc.paths || {};

  // Load schemas
  const schemaDir = path.join(OPENAPI_PATH, 'components/schemas');
  if (fs.existsSync(schemaDir)) {
    const schemaFiles = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.yaml'));
    schemaFiles.forEach((file) => {
      const content = yaml.load(fs.readFileSync(path.join(schemaDir, file), 'utf8')) as any;
      Object.assign(rootDoc.components.schemas, content);
    });
  }

  // Load paths
  const pathsDir = path.join(OPENAPI_PATH, 'paths');
  if (fs.existsSync(pathsDir)) {
    const pathFiles = fs.readdirSync(pathsDir).filter((f) => f.endsWith('.yaml'));
    pathFiles.forEach((file) => {
      const content = yaml.load(fs.readFileSync(path.join(pathsDir, file), 'utf8')) as any;
      Object.assign(rootDoc.paths, content);
    });
  }

  return rootDoc;
};

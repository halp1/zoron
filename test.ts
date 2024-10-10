import {encrypt, decrypt} from './src/lib/aspen/crypt';

const encrypted = encrypt('26stu282@lexingtonma.org', 'stuliu53', 'GOOF597road');
console.log(encrypted);
console.log(decrypt('26stu282@lexingtonma.org', encrypted));
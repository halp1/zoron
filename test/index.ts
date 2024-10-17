import {aspen} from '../src/lib/aspen';

const account = await aspen.authenticate(process.env.USERNAME!, process.env.PASSWORD!);

console.log(account.name)
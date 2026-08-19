import { handler } from './bundle.js';

export default function onRequest(context) {
  return handler(context);
}

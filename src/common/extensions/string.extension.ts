import * as http from 'https';

export {};

declare global {
  interface String {
    readHtml(): Promise<string>;
  }
}

String.prototype.readHtml =  async function (): Promise<string> {
  const self = this as string;

  const html = await new Promise((resolve, reject) => {
    const request = http.get(self, response => {
      let data: string = '';

      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    });

    request.on('error', error => reject(error));
    request.end();
  }).catch(() => console.error('ERROR GETTING HTML')) ?? '';

  return html as string;
}
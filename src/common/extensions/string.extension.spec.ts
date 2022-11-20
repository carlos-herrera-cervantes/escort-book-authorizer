import './string.extension';

describe('StringExtension', () => {
  it('readHtml - Should return an empty string when an error occurs', async () => {
    const badUrl = 'bad url';
    const htmlResult = await badUrl.readHtml();
    expect(htmlResult).toEqual('');
  });
});

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Configuração do cliente Google Sheets para Obras e Demandas
const auth = new JWT({
  email: 'potalaplicacoesobras@portalaplicacoesobras.iam.gserviceaccount.com',
  key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfieh8nyNUAkyn\ngiG9EUcsoF59B4Nv3DMApDp6QSdWGOzg4ri/M+t5LDip+RDxf+r9TVUEySLZczrJ\nMfv2Dr0IvFEHlMh4HefVBz2ayFoAgduLPUivskTJRPU5YD7QW6UnOv1PUoZkBQX4\nw9SZc3CqdCdW48guAeM6APu3+lGSbq9AXhBNeEsCNR2nppNe/VAOQIo6NQMv2dUf\n8lj7XxiSgnb9nb/5VKKqkUDWRj9r3XFfkGtrLrqsg2bLeJ+rCeqPziAvjSh/vmJp\nCax6+76ziPu7Gp5bs5+VVkyCgQKOamMheOU/T8OXn8O5rMfgksZpFqyR7CTKkNni\n7QFwyB03AgMBAAECggEAAN+0xSdszSA06h1q4JBxiAY85u5wskr3cboh7mPDug7v\ntkwKgs21IlvZOPIZBzplKDr9ngcbWVsuKDzM7+WMM2neFyMVY+L+CrDd4aH/b+Yo\nUZNwsIpyBC0PHgExo+3KOJkl5JKkbaI7p4EPx8P2OCji6KgzFOTfu/B3WVud//lB\nI8aa20SwWF3bkzx/lOLQHXOlh6BAZaX8xgzqQ77KotUv90FbFOTDp4cSxUF0hEKS\nlLxKmgwwHSdB88BsE5EdGr94aEBMj8ZlqO9sOM+KGuu2HR/3woRCgrVXbe6VjfCT\nvL6SEtmglayqm8XYin7kKqrvzqfiW3ASrEmLTwnoFQKBgQD8v1slQWci2IkC1A22\n4ukSV5OFNqerZJzPTu00vEf0WAN8qo8mqQrVbE3vAfVAfavnraQ7KDr/82pL8plN\nvgg5qlOHqy0kC4Df6JazZTuzhLxHKoQcDh2LHfyli4fOrpZ1/XLA0x7dM3Uq0DAu\nXtLvRC9MbKyjKN7LnrLL6tY5jQKBgDialPautg3o5JmafPBqg/7f96AD2+EQFRj\nHtC8crDAYEu9eMWUIibNXUAtEmmu0eiUI8oNH48Z8H0TPClIglrBhaa2E8xcZlXt\nAETOwOE2DzPwkvB39PtuibOTfR5AzAmZfeiFUbS755Ni7VVyN5HHSv0Z9FVH9l/m\nJ4Kqlwrm0wKBgQDBAWea1YzqwSwvartmU3TkOtg+O/RiH5zXelANm1HfN27CPoS+\nYwwQ2nnQ8E/WhaFGdAUb36beWYVspb+H7HvffT/4NDFuexJY6gZazA2BEvWr6r2j\npuvMloOd7yUwIYZoZ7i/ovjItkjc/sosPuEZMZpk5AAZQFaSa4fhzFz26QKBgQCV\n5Ub2vFSBIW2/F84lHO3P12v65D00FVLI/JG88UFLW3VJTzefRqzhsSbXsCT/dEDC\nMp+F6KrYxXpIzb+XHZXwIQep65mUYrvoWBE1wERZgd8lGmLRSANdvxSARIlO5MZG\nNDFIcjtxW3McP3weTePZSTAfir8bEWWT/fxn6+9vuQKBgEX2tkGe7uqUJhU3Ya9Y\nPApuRGmW/9RM2N/NkWIMdtsL+4EeyoyDp32kjKqLK5m+PtsXiqPC9e3F5CXhWZaK\nl8DyIYrRrSBxrGPMJEPXmcub5x7BhbMigKQGTuvYRfxiMnaWIaEU0cqEuh3glxe5\niQ/+0AzvwaxmnHbGbCdW+c6u\n-----END PRIVATE KEY-----\n',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

export const OBRAS_SHEET_ID = process.env.OBRAS_SHEET_ID || '1lYB7Uk3MEGgOLIwU1auUAlXLv_LfumfYg4FMPJFbBkI';
export const OBRAS_SHEET_NAME = process.env.OBRAS_SHEET_NAME || 'Cadastro de demandas';

// Função para obter uma instância autenticada do documento
export async function getDoc() {
  try {
    const doc = new GoogleSpreadsheet(OBRAS_SHEET_ID, auth);
    await doc.loadInfo();
    return doc;
  } catch (error) {
    console.error('Erro ao inicializar documento:', error);
    throw error;
  }
} 
const env = require('../env.json')

export function companyLogo(i) {
  if (!i)
    return '';
  return `${env.BACKEND_URL}/companies/${i}/logo`;
}

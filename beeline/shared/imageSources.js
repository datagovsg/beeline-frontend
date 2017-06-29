export function companyLogo(i, width) {
  if (!i)
    return '';
  return `${process.env.BACKEND_URL}/companies/${i}/logo`;
}

export function miniCompanyLogo(i) {
  if (!i)
    return '';
  return  `${process.env.BACKEND_URL}/companies/${i}/logo?width=20`;
}

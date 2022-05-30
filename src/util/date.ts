export function getCurrentMonth() {
  const locale = new Intl.DateTimeFormat('en-GB', { month: 'long' });
  
  return locale.format(new Date());
}
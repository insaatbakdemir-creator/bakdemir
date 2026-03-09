export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(Number(value) || 0);

export const formatDate = (value) => (value ? new Intl.DateTimeFormat('tr-TR').format(new Date(value)) : '-');

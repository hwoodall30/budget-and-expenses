const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Format integer cents as USD. */
export function formatMoney(cents: number): string {
	return usd.format(cents / 100);
}

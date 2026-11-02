import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
	test(`entry and partial settlement at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');
		await expect(page.getByText('Sample data only', { exact: true })).toBeVisible();
		await page.getByLabel('Description', { exact: true }).fill('Sunday snacks');
		await page.getByLabel('Total (USD)', { exact: true }).fill('42.75');
		await page
			.getByRole('combobox', { name: 'Category 1', exact: true })
			.selectOption('Sunday Consumables');
		await page.getByRole('button', { name: 'Add purchase' }).click();
		await expect(page.getByRole('status')).toHaveText('Added to sample data.');
		await expect(page.getByTestId('available')).toHaveText('$1,507.25');
		await page.getByRole('button', { name: 'Settle Classroom equipment' }).click();
		await expect(page.getByLabel('Purchase date')).toHaveValue('2026-11-15');
		await expect(page.getByLabel('Description', { exact: true })).toHaveValue(
			'Classroom equipment'
		);
		await page.getByLabel('Total (USD)', { exact: true }).fill('180');
		await page.getByLabel('Keep a planned remainder').check();
		await page.getByLabel('Remaining total (USD)').fill('120');
		await page.getByRole('button', { name: 'Record settlement' }).click();
		await expect(page.getByRole('status')).toHaveText('Settlement recorded in sample data.');
		await expect(page.getByTestId('available')).toHaveText('$1,507.25');
		await expect(page.getByText('Classroom equipment — remainder', { exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Edit Classroom equipment', exact: true }).click();
		await page.getByLabel('Description', { exact: true }).fill('Corrected equipment');
		await page.getByLabel('Total (USD)', { exact: true }).fill('200');
		await page.getByRole('button', { name: 'Update purchase', exact: true }).click();
		await expect(page.getByRole('status')).toHaveText('Purchase updated in sample data.');
		await expect(page.getByTestId('available')).toHaveText('$1,487.25');
		await page.getByRole('button', { name: 'Delete Corrected equipment', exact: true }).click();
		await expect(page.getByTestId('available')).toHaveText('$1,687.25');
		await expect(
			page.getByRole('heading', { name: 'Corrected equipment', exact: true })
		).toHaveCount(0);
		await expect(page.getByText('Classroom equipment — remainder', { exact: true })).toBeVisible();

		expect(
			await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
		).toBe(true);
	});
}

test('split validation preserves edits; expected plans can be committed and fully settled', async ({
	page
}) => {
	await page.goto('/');
	await page.getByLabel('Description', { exact: true }).fill('Mixed supplies');
	await page.getByLabel('Total (USD)', { exact: true }).fill('100');
	await page.getByRole('button', { name: '+ Split across categories', exact: true }).click();
	await page.getByLabel('Amount 1 (USD)', { exact: true }).fill('60');
	await page.getByLabel('Amount 2 (USD)', { exact: true }).fill('30');
	await page
		.getByRole('combobox', { name: 'Category 2', exact: true })
		.selectOption('Classroom Supplies');
	await page.getByRole('button', { name: 'Add purchase' }).click();
	await expect(page.getByRole('alert')).toContainText('Allocations must equal the total.');
	await expect(page.getByLabel('Description', { exact: true })).toHaveValue('Mixed supplies');
	await page.getByLabel('Amount 2 (USD)', { exact: true }).fill('40');
	await page.getByRole('button', { name: 'Add purchase' }).click();
	await expect(page.getByTestId('available')).toHaveText('$1,450.00');
	await page.getByRole('button', { name: 'Edit Advent family resources' }).click();
	await page.getByRole('combobox', { name: 'Record type', exact: true }).selectOption('committed');
	await page.getByLabel('Total (USD)', { exact: true }).fill('250');
	await page.getByRole('button', { name: 'Update plan' }).click();
	await expect(page.getByTestId('available')).toHaveText('$1,200.00');
	await page.getByRole('button', { name: 'Settle Advent family resources' }).click();
	await page.getByLabel('Description', { exact: true }).fill('Final family resources');
	await page.getByLabel('Purchase date').fill('2026-11-10');
	await page
		.getByRole('combobox', { name: 'Category 1', exact: true })
		.selectOption('Discipleship');
	await page.getByLabel('Total (USD)', { exact: true }).fill('230');
	await page.getByRole('button', { name: 'Record settlement' }).click();
	await expect(page.getByTestId('available')).toHaveText('$1,220.00');
	await expect(page.getByText('Final family resources', { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByTestId('available')).toHaveText('$1,550.00');
});

test('ordinary actuals are editable and all record types are deletable', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Edit Volunteer appreciation meal', exact: true }).click();
	await page.getByLabel('Total (USD)', { exact: true }).fill('80');
	await page.getByLabel('Purchase date').fill('2026-10-16');
	await page.getByRole('combobox', { name: 'Category 1', exact: true }).selectOption('Admin');
	await page.getByRole('button', { name: 'Update purchase', exact: true }).click();
	await expect(page.getByTestId('available')).toHaveText('$1,620.00');
	await page
		.getByRole('button', { name: 'Delete Volunteer appreciation meal', exact: true })
		.click();
	await expect(page.getByTestId('available')).toHaveText('$1,700.00');
	await page.getByRole('button', { name: 'Delete Classroom equipment', exact: true }).click();
	await expect(page.getByTestId('available')).toHaveText('$2,000.00');
	await page.getByRole('button', { name: 'Delete Advent family resources', exact: true }).click();
	await expect(page.getByText('No purchases or plans', { exact: true })).toBeVisible();
});

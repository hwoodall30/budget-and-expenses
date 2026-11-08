import { expect, test } from 'vitest';
import {
	createSampleBudget,
	createBusySampleBudget,
	recordPurchase,
	balances,
	editPlan,
	editPurchase,
	deletePurchase,
	settlePlan
} from './budget';

test('actual split spending reduces annual funds once', () => {
	const budget = recordPurchase(createSampleBudget(), {
		description: 'Supplies',
		date: '2026-11-01',
		amount: 10000,
		kind: 'actual',
		allocations: [
			{ category: 'Sunday Consumables', amount: 6000 },
			{ category: 'Classroom Supplies', amount: 4000 }
		]
	});
	expect(balances(budget)).toEqual({
		actual: 25000,
		committed: 30000,
		expected: 20000,
		available: 145000,
		projected: 125000
	});
});

test('rejects unreconciled splits without changing records', () => {
	const budget = createSampleBudget();
	expect(() =>
		recordPurchase(budget, {
			description: 'Bad split',
			date: '2026-11-01',
			amount: 10000,
			kind: 'actual',
			allocations: [{ category: 'Admin', amount: 9000 }]
		})
	).toThrow('Allocations must equal the total.');
	expect(budget.purchases).toHaveLength(3);
});

test('editing and committing an expected plan changes available funds', () => {
	const budget = editPlan(createSampleBudget(), 3, {
		description: 'Revised resources',
		date: '2026-12-02',
		amount: 25000,
		kind: 'committed',
		allocations: [{ category: 'Parents', amount: 25000 }]
	});
	expect(balances(budget).available).toBe(130000);
	expect(budget.purchases.find((p) => p.id === 3)?.originalEstimate).toBe(20000);
	expect(budget.purchases.find((p) => p.id === 3)?.history).toHaveLength(1);
});

test('settlement replaces commitment with editable actual and reviewed split remainder', () => {
	const budget = settlePlan(
		createSampleBudget(),
		2,
		{
			description: 'Partial equipment',
			date: '2026-11-02',
			amount: 18000,
			kind: 'actual',
			allocations: [
				{ category: 'Admin', amount: 8000 },
				{ category: 'Classroom Supplies', amount: 10000 }
			]
		},
		{ amount: 12000, allocations: [{ category: 'Classroom Supplies', amount: 12000 }] }
	);
	expect(balances(budget)).toEqual({
		actual: 33000,
		committed: 12000,
		expected: 20000,
		available: 155000,
		projected: 135000
	});
	expect(budget.purchases.find((p) => p.id === 2)).toMatchObject({
		description: 'Partial equipment',
		date: '2026-11-02',
		kind: 'actual',
		originalEstimate: 30000
	});
	expect(() => settlePlan(budget, 2, budget.purchases[1])).toThrow('This plan is no longer open.');
});

test('default settlement closes the full estimate even when actual price differs', () => {
	const budget = settlePlan(createSampleBudget(), 2, {
		description: 'Final equipment',
		date: '2026-11-03',
		amount: 35000,
		kind: 'actual',
		allocations: [{ category: 'Classroom Supplies', amount: 35000 }]
	});
	expect(balances(budget)).toEqual({
		actual: 50000,
		committed: 0,
		expected: 20000,
		available: 150000,
		projected: 130000
	});
	expect(budget.purchases).toHaveLength(3);
});

test('invalid remainder allocations reject the entire settlement', () => {
	const budget = createSampleBudget();
	expect(() =>
		settlePlan(
			budget,
			2,
			{
				description: 'Partial',
				date: '2026-11-03',
				amount: 18000,
				kind: 'actual',
				allocations: [{ category: 'Admin', amount: 18000 }]
			},
			{ amount: 12000, allocations: [{ category: 'Admin', amount: 10000 }] }
		)
	).toThrow('Allocations must equal the total.');
	expect(balances(budget).committed).toBe(30000);
	expect(balances(budget).actual).toBe(15000);
});

test.each([0, -100, 1.5, Number.MAX_SAFE_INTEGER + 1])(
	'rejects invalid minor-unit amount %s',
	(amount) => {
		expect(() =>
			recordPurchase(createSampleBudget(), {
				description: 'Invalid',
				date: '2026-11-03',
				amount,
				kind: 'actual',
				allocations: [{ category: 'Admin', amount }]
			})
		).toThrow();
	}
);

test('overspending stays visible as a negative balance', () => {
	const budget = recordPurchase(createSampleBudget(), {
		description: 'Large purchase',
		date: '2026-11-03',
		amount: 200000,
		kind: 'actual',
		allocations: [{ category: 'Admin', amount: 200000 }]
	});
	expect(balances(budget).available).toBe(-45000);
});

test('settled actual purchases remain editable without changing the retained plan', () => {
	const settled = settlePlan(
		createSampleBudget(),
		2,
		{
			description: 'Equipment',
			date: '2026-11-02',
			amount: 18000,
			kind: 'actual',
			allocations: [{ category: 'Admin', amount: 18000 }]
		},
		{ amount: 12000, allocations: [{ category: 'Classroom Supplies', amount: 12000 }] }
	);
	const edited = editPurchase(settled, 2, {
		description: 'Corrected equipment',
		date: '2026-11-03',
		amount: 20000,
		kind: 'actual',
		allocations: [
			{ category: 'Admin', amount: 5000 },
			{ category: 'Classroom Supplies', amount: 15000 }
		]
	});
	expect(balances(edited)).toEqual({
		actual: 35000,
		committed: 12000,
		expected: 20000,
		available: 153000,
		projected: 133000
	});
	expect(edited.purchases.find((p) => p.id === 2)).toMatchObject({
		description: 'Corrected equipment',
		originalEstimate: 30000,
		date: '2026-11-03'
	});
	expect(edited.purchases.find((p) => p.id === 2)?.history).toHaveLength(2);
	expect(() => editPurchase(edited, 2, { ...edited.purchases[1], kind: 'expected' })).toThrow(
		'Actual purchases must remain actual.'
	);
});

test('deleting a settled actual removes its spending but preserves the remainder', () => {
	const settled = settlePlan(
		createSampleBudget(),
		2,
		{
			description: 'Equipment',
			date: '2026-11-02',
			amount: 18000,
			kind: 'actual',
			allocations: [{ category: 'Admin', amount: 18000 }]
		},
		{ amount: 12000, allocations: [{ category: 'Classroom Supplies', amount: 12000 }] }
	);
	const deleted = deletePurchase(settled, 2);
	expect(balances(deleted)).toEqual({
		actual: 15000,
		committed: 12000,
		expected: 20000,
		available: 173000,
		projected: 153000
	});
	expect(deleted.purchases.some((p) => p.id === 2)).toBe(false);
	expect(() => deletePurchase(deleted, 2)).toThrow('This purchase no longer exists.');
});

test.each([1, 2, 3])('any purchase or plan can be deleted (%s)', (id) => {
	expect(deletePurchase(createSampleBudget(), id).purchases.map((p) => p.id)).not.toContain(id);
});

test('busy sample year contains many valid records', () => {
	const budget = createBusySampleBudget();
	expect(budget.purchases).toHaveLength(64);
	expect(new Set(budget.purchases.map((p) => p.id)).size).toBe(64);
	for (const { id, description, date, amount, kind, allocations } of budget.purchases)
		expect(() =>
			editPurchase(budget, id, { description, date, amount, kind, allocations })
		).not.toThrow();
	expect(balances(budget).available).toBeGreaterThan(0);
});

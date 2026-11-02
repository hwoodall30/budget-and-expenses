import { expect, test } from 'vitest';
import { createSampleBudget, recordPurchase, balances, editPlan, settlePlan } from './budget';

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

export const categories = [
	'Volunteers',
	'Training',
	'Admin',
	'Sunday Consumables',
	'Classroom Supplies',
	'Events',
	'Parents',
	'Discipleship',
	'Guest Experience',
	'Curriculum',
	'Production & Technology',
	'Environments'
];
export type Allocation = { category: string; amount: number };
export type PurchaseInput = {
	description: string;
	date: string;
	amount: number;
	kind: 'actual' | 'expected' | 'committed';
	allocations: Allocation[];
};
export type Purchase = PurchaseInput & { id: number; originalEstimate: number; history: string[] };
export type Budget = { annual: number; purchases: Purchase[]; nextId: number };
export function createSampleBudget(): Budget {
	const seed: PurchaseInput[] = [
		{
			description: 'Volunteer appreciation meal',
			date: '2026-10-15',
			amount: 15000,
			kind: 'actual',
			allocations: [{ category: 'Volunteers', amount: 15000 }]
		},
		{
			description: 'Classroom equipment',
			date: '2026-11-15',
			amount: 30000,
			kind: 'committed',
			allocations: [{ category: 'Classroom Supplies', amount: 30000 }]
		},
		{
			description: 'Advent family resources',
			date: '2026-12-01',
			amount: 20000,
			kind: 'expected',
			allocations: [{ category: 'Parents', amount: 20000 }]
		}
	];
	return {
		annual: 200000,
		nextId: 4,
		purchases: seed.map((p, i) => ({ ...p, id: i + 1, originalEstimate: p.amount, history: [] }))
	};
}
/** A fuller fictional year (dozens of records) for trying the table and pagination. */
export function createBusySampleBudget(count = 64): Budget {
	const items = [
		'Snack restock',
		'Craft supplies',
		'Volunteer lunch',
		'Curriculum license',
		'Event decorations',
		'Printer ink',
		'Parent night dessert',
		'Small group books',
		'Welcome table flowers',
		'Cable and adapters',
		'Room signage',
		'Training workshop'
	];
	const kinds: PurchaseInput['kind'][] = ['actual', 'actual', 'actual', 'committed', 'expected'];
	const purchases: Purchase[] = Array.from({ length: count }, (_, i) => {
		const amount = 1500 + ((i * 7919) % 38) * 500 + ((i * 31) % 4) * 25;
		const category = categories[(i * 5) % categories.length];
		const second = categories[(i * 5 + 3) % categories.length];
		const split = i % 9 === 4;
		const first = split ? Math.round(amount * 0.6) : amount;
		const month = String((i % 12) + 1).padStart(2, '0');
		const day = String(((i * 11) % 28) + 1).padStart(2, '0');
		return {
			id: i + 1,
			description: `${items[i % items.length]} #${Math.floor(i / items.length) + 1}`,
			date: `2026-${month}-${day}`,
			amount,
			kind: kinds[i % kinds.length],
			allocations: split
				? [
						{ category, amount: first },
						{ category: second, amount: amount - first }
					]
				: [{ category, amount }],
			originalEstimate: amount,
			history: []
		};
	});
	return { annual: 2500000, nextId: count + 1, purchases };
}
export function recordPurchase(budget: Budget, input: PurchaseInput): Budget {
	validate(input);
	return {
		...budget,
		nextId: budget.nextId + 1,
		purchases: [
			...budget.purchases,
			{ ...input, id: budget.nextId, originalEstimate: input.amount, history: [] }
		]
	};
}
export function balances(budget: Budget) {
	const sum = (kind: PurchaseInput['kind']) =>
		budget.purchases.filter((p) => p.kind === kind).reduce((total, p) => total + p.amount, 0);
	const actual = sum('actual'),
		committed = sum('committed'),
		expected = sum('expected');
	return {
		actual,
		committed,
		expected,
		available: budget.annual - actual - committed,
		projected: budget.annual - actual - committed - expected
	};
}

function validate(input: PurchaseInput) {
	if (!input.description.trim()) throw new Error('Enter a description.');
	if (
		!/^2026-\d{2}-\d{2}$/.test(input.date) ||
		Number.isNaN(Date.parse(input.date)) ||
		new Date(input.date).toISOString().slice(0, 10) !== input.date
	)
		throw new Error('Choose a valid date in sample year 2026.');
	if (!Number.isSafeInteger(input.amount) || input.amount <= 0)
		throw new Error('Enter a positive amount with at most two decimal places.');
	if (
		!input.allocations.length ||
		input.allocations.some(
			(a) => !categories.includes(a.category) || !Number.isSafeInteger(a.amount) || a.amount <= 0
		)
	)
		throw new Error('Every allocation needs a category and positive amount.');
	if (input.allocations.reduce((sum, a) => sum + a.amount, 0) !== input.amount)
		throw new Error('Allocations must equal the total.');
}
export function editPlan(budget: Budget, id: number, input: PurchaseInput): Budget {
	const plan = budget.purchases.find((p) => p.id === id);
	if (!plan || plan.kind === 'actual' || input.kind === 'actual')
		throw new Error('This plan is no longer open.');
	return editPurchase(budget, id, input);
}
export function editPurchase(budget: Budget, id: number, input: PurchaseInput): Budget {
	validate(input);
	const purchase = budget.purchases.find((p) => p.id === id);
	if (!purchase) throw new Error('This purchase no longer exists.');
	if (purchase.kind === 'actual' && input.kind !== 'actual')
		throw new Error('Actual purchases must remain actual.');
	if (purchase.kind !== 'actual' && input.kind === 'actual')
		throw new Error('Use settlement to record a plan as actual.');
	return {
		...budget,
		purchases: budget.purchases.map((p) =>
			p.id === id
				? {
						...p,
						...input,
						history: [
							...p.history,
							`${p.description}: ${p.amount / 100} ${p.kind}, ${p.date}; ${p.allocations.map((a) => `${a.category} ${a.amount / 100}`).join(', ')}`
						]
					}
				: p
		)
	};
}
export function settlePlan(
	budget: Budget,
	id: number,
	actual: PurchaseInput,
	remainder?: { amount: number; allocations: Allocation[] }
): Budget {
	const plan = budget.purchases.find((p) => p.id === id);
	if (!plan || plan.kind === 'actual') throw new Error('This plan is no longer open.');
	validate(actual);
	if (actual.kind !== 'actual') throw new Error('Settlement must record an actual purchase.');
	if (remainder) validate({ ...plan, ...remainder });
	const settled: Purchase = {
		...plan,
		...actual,
		history: [
			...plan.history,
			`Settled ${plan.amount / 100} ${plan.kind} plan: ${plan.description}, ${plan.date}; ${plan.allocations.map((a) => `${a.category} ${a.amount / 100}`).join(', ')}`
		]
	};
	const result = { ...budget, purchases: budget.purchases.map((p) => (p.id === id ? settled : p)) };
	if (!remainder) return result;
	return {
		...result,
		nextId: budget.nextId + 1,
		purchases: [
			...result.purchases,
			{
				...plan,
				...remainder,
				id: budget.nextId,
				description: `${plan.description} — remainder`,
				history: [...plan.history, `Remaining from plan #${id}; actual ${actual.amount / 100}`]
			}
		]
	};
}
export function deletePurchase(budget: Budget, id: number): Budget {
	if (!budget.purchases.some((p) => p.id === id))
		throw new Error('This purchase no longer exists.');
	return { ...budget, purchases: budget.purchases.filter((p) => p.id !== id) };
}
